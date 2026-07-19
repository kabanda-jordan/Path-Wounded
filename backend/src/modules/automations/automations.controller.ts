import type { Request, Response } from 'express'
import * as automationsService from './automations.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function list(req: Request, res: Response) {
  const automations = await automationsService.listAutomations(req.user!.userId)
  return sendSuccess(res, automations)
}

export async function get(req: Request, res: Response) {
  const automation = await automationsService.getAutomation(req.params.id as string)
  if (!automation) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Automation not found' } })
  return sendSuccess(res, automation)
}

export async function create(req: Request, res: Response) {
  const automation = await automationsService.createAutomation(req.user!.userId, req.body)
  return sendSuccess(res, automation, 201)
}

export async function update(req: Request, res: Response) {
  const automation = await automationsService.updateAutomation(req.params.id as string, req.body)
  return sendSuccess(res, automation)
}

export async function remove(req: Request, res: Response) {
  await automationsService.deleteAutomation(req.params.id as string)
  return sendSuccess(res, { message: 'Automation deleted' })
}

export async function toggle(req: Request, res: Response) {
  const automation = await automationsService.toggleAutomation(req.params.id as string)
  return sendSuccess(res, automation)
}
