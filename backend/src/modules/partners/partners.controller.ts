import type { Request, Response } from 'express'
import * as partnersService from './partners.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function listPartners(req: Request, res: Response) {
  const partners = await partnersService.listPartners(req.params.carrierId as string)
  return sendSuccess(res, partners)
}

export async function createPartner(req: Request, res: Response) {
  const partner = await partnersService.createPartner({ ...req.body, carrierId: req.params.carrierId as string })
  return sendSuccess(res, partner, 201)
}

export async function deletePartner(req: Request, res: Response) {
  await partnersService.deletePartner(req.params.id as string)
  return sendSuccess(res, { message: 'Partner deleted' })
}
