import type { Request, Response } from 'express'
import * as authService from './auth.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function signup(req: Request, res: Response) {
  const result = await authService.signup(req.body)
  return sendSuccess(res, result, 201)
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body
  const ip = req.ip
  const result = await authService.login(email, password, ip)

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })

  return sendSuccess(res, { accessToken: result.accessToken, user: result.user })
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken || req.body.refreshToken
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' } })
  }
  const result = await authService.refresh(token)

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })

  return sendSuccess(res, { accessToken: result.accessToken })
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken || req.body.refreshToken
  if (token) {
    try { await authService.logout(token) } catch { /* token may already be revoked */ }
  }
  res.clearCookie('refreshToken')
  return sendSuccess(res, { message: 'Logged out successfully' })
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body
  const { prisma } = await import('../../config/database.js')
  const { hashToken } = await import('../../utils/crypto.js')

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
  })

  if (!stored || stored.revoked || new Date() > stored.expiresAt) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' } })
  }

  await prisma.user.update({
    where: { id: stored.userId },
    data: { emailVerified: true },
  })
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } })

  return sendSuccess(res, { message: 'Email verified successfully' })
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email)
  return sendSuccess(res, { message: 'If an account exists, a reset link has been sent' })
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password)
  return sendSuccess(res, { message: 'Password reset successful' })
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.userId)
  return sendSuccess(res, user)
}
