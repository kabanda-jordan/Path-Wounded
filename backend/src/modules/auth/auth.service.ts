import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../../config/database.js'
import { env } from '../../config/env.js'
import { hashToken, generateToken } from '../../utils/crypto.js'
import { sendEmail } from '../../utils/email.js'
import { logger } from '../../utils/logger.js'
import type { SignupInput } from './auth.validation.js'

const SALT_ROUNDS = 12

function signAccessToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any })
}

function signRefreshToken(payload: { userId: string; tokenId: string }) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any })
}

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/)
  if (!match) return 30 * 24 * 60 * 60 * 1000
  const val = parseInt(match[1])
  const unit = match[2]
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return val * ms[unit]
}

export async function signup(input: SignupInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError('EMAIL_EXISTS', 'An account with this email already exists', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      companyName: input.companyName,
      role: input.role || 'broker',
    },
  })

  const verificationToken = generateToken()
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'SIGNUP',
      metadata: { email: user.email },
    },
  })

  const verifyUrl = `${env.CORS_ORIGIN}/verify-email?token=${verificationToken}`
  await sendEmail(
    user.email,
    'Verify your Path Wounded account',
    `<p>Welcome to Path Wounded! Click <a href="${verifyUrl}">here</a> to verify your email.</p>`
  )

  return { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } }
}

export async function login(email: string, password: string, ip?: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    await prisma.auditLog.create({
      data: { action: 'LOGIN_FAILED', metadata: { email }, ipAddress: ip },
    })
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
  }

  if (user.status === 'suspended') {
    throw new AppError('ACCOUNT_SUSPENDED', 'Your account has been suspended', 403)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN_FAILED', metadata: { email }, ipAddress: ip },
    })
    throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role }
  const accessToken = signAccessToken(tokenPayload)

  const refreshTokenValue = generateToken()
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY))

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshTokenValue),
      expiresAt,
    },
  })

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: ip },
  })

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  }
}

export async function refresh(refreshTokenValue: string) {
  if (!refreshTokenValue) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'No refresh token provided', 401)
  }
  const tokenHash = hashToken(refreshTokenValue)

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!stored || stored.revoked) {
    if (stored?.revoked) {
      logger.warn({ userId: stored.userId }, 'Refresh token reuse detected — possible theft')
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revoked: false },
        data: { revoked: true },
      })
    }
    throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401)
  }

  if (new Date() > stored.expiresAt) {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token has expired', 401)
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true },
  })

  const newRefreshValue = generateToken()
  await prisma.refreshToken.create({
    data: {
      userId: stored.userId,
      tokenHash: hashToken(newRefreshValue),
      expiresAt: stored.expiresAt,
    },
  })

  const accessToken = signAccessToken({
    userId: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  })

  return { accessToken, refreshToken: newRefreshValue }
}

export async function logout(refreshTokenValue: string) {
  if (!refreshTokenValue) return
  const tokenHash = hashToken(refreshTokenValue)
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  })
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return

  const resetToken = generateToken()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(resetToken), expiresAt },
  })

  const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${resetToken}`
  await sendEmail(
    user.email,
    'Reset your Path Wounded password',
    `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
  )

  await prisma.auditLog.create({
    data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED' },
  })
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(token)
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!stored || stored.revoked || new Date() > stored.expiresAt) {
    throw new AppError('INVALID_RESET_TOKEN', 'Invalid or expired reset token', 400)
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId: stored.userId }, data: { revoked: true } }),
    prisma.auditLog.create({
      data: { userId: stored.userId, action: 'PASSWORD_RESET_COMPLETED' },
    }),
  ])
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      companyName: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      status: true,
      createdAt: true,
    },
  })
  return user
}

class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}
