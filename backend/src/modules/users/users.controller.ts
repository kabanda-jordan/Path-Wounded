import type { Request, Response } from 'express'
import * as usersService from './users.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function getProfile(req: Request, res: Response) {
  const user = await usersService.getUser(req.user!.userId)
  return sendSuccess(res, user)
}

export async function updateProfile(req: Request, res: Response) {
  const user = await usersService.updateProfile(req.user!.userId, req.body)
  return sendSuccess(res, user)
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body
  await usersService.changePassword(req.user!.userId, currentPassword, newPassword)
  return sendSuccess(res, { message: 'Password changed successfully' })
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } })
  const result = await usersService.uploadAvatar(req.user!.userId, req.file.buffer, req.file.originalname, req.file.mimetype)
  return sendSuccess(res, result)
}
