import type { Request, Response } from 'express'
import * as messagesService from './messages.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function send(req: Request, res: Response) {
  const message = await messagesService.sendMessage(req.user!.userId, req.body)
  return sendSuccess(res, message, 201)
}

export async function getThread(req: Request, res: Response) {
  const messages = await messagesService.getThread(req.params.threadId as string)
  return sendSuccess(res, messages)
}

export async function getThreads(req: Request, res: Response) {
  const threads = await messagesService.getUserThreads(req.user!.userId)
  return sendSuccess(res, threads)
}

export async function markRead(req: Request, res: Response) {
  await messagesService.markRead(req.params.threadId as string, req.user!.userId)
  return sendSuccess(res, { message: 'Thread marked as read' })
}

export async function unreadCount(req: Request, res: Response) {
  const count = await messagesService.getUnreadCount(req.user!.userId)
  return sendSuccess(res, { count })
}
