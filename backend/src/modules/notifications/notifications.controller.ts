import type { Request, Response } from 'express'
import * as notificationsService from './notifications.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function list(req: Request, res: Response) {
  const unreadOnly = req.query.unreadOnly === 'true'
  const notifications = await notificationsService.listNotifications(req.user!.userId, unreadOnly)
  return sendSuccess(res, notifications)
}

export async function unreadCount(req: Request, res: Response) {
  const count = await notificationsService.getUnreadCount(req.user!.userId)
  return sendSuccess(res, { count })
}

export async function markRead(req: Request, res: Response) {
  await notificationsService.markRead(req.params.id as string)
  return sendSuccess(res, { message: 'Notification marked as read' })
}

export async function markAllRead(req: Request, res: Response) {
  await notificationsService.markAllRead(req.user!.userId)
  return sendSuccess(res, { message: 'All notifications marked as read' })
}
