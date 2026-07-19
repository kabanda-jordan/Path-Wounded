import bcrypt from 'bcrypt'
import { prisma } from '../../config/database.js'
import { uploadFile } from '../../utils/s3.js'

export async function updateProfile(userId: string, data: { fullName?: string; companyName?: string }) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, email: true, fullName: true, companyName: true, role: true, avatarUrl: true,
    },
  })
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new AppError('INVALID_PASSWORD', 'Current password is incorrect', 400)

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } }),
  ])
}

export async function uploadAvatar(userId: string, buffer: Buffer, originalName: string, contentType: string) {
  const url = await uploadFile(buffer, originalName, contentType)
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
    select: { id: true, avatarUrl: true },
  })
}

export async function getUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true, email: true, fullName: true, companyName: true, role: true,
      avatarUrl: true, emailVerified: true, status: true, createdAt: true,
    },
  })
}

class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message); this.name = 'AppError'
  }
}
