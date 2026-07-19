import type { Request, Response } from 'express'
import * as carriersService from './carriers.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function listCarriers(req: Request, res: Response) {
  const result = await carriersService.listCarriers(req.query as any)
  return sendSuccess(res, result.carriers, 200, result.meta)
}

export async function getCarrier(req: Request, res: Response) {
  const carrier = await carriersService.getCarrier(req.params.id as string)
  if (!carrier) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Carrier not found' } })
  return sendSuccess(res, carrier)
}

export async function createCarrier(req: Request, res: Response) {
  const carrier = await carriersService.createCarrier(req.body)
  return sendSuccess(res, carrier, 201)
}

export async function updateCarrier(req: Request, res: Response) {
  const carrier = await carriersService.updateCarrier(req.params.id as string, req.body)
  return sendSuccess(res, carrier)
}

export async function getTopCarriers(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 10
  const carriers = await carriersService.getTopCarriers(limit)
  return sendSuccess(res, carriers)
}

export async function createReview(req: Request, res: Response) {
  const review = await carriersService.createReview(req.user!.userId, req.params.carrierId as string, req.body)
  return sendSuccess(res, review, 201)
}

export async function getReviews(req: Request, res: Response) {
  const result = await carriersService.getReviews(req.params.carrierId as string, req.query as any)
  return sendSuccess(res, result.reviews, 200, result.meta)
}
