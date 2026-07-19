import type { Request, Response } from 'express'
import * as analyticsService from './analytics.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function getOverview(_req: Request, res: Response) {
  const overview = await analyticsService.getOverview()
  return sendSuccess(res, overview)
}

export async function getRevenueOverTime(req: Request, res: Response) {
  const range = (req.query.range as string) || '30d'
  const data = await analyticsService.getRevenueOverTime(range)
  return sendSuccess(res, data)
}

export async function getVehicleBreakdown(_req: Request, res: Response) {
  const breakdown = await analyticsService.getVehicleBreakdown()
  return sendSuccess(res, breakdown)
}

export async function getOrderStatusBreakdown(_req: Request, res: Response) {
  const breakdown = await analyticsService.getOrderStatusBreakdown()
  return sendSuccess(res, breakdown)
}
