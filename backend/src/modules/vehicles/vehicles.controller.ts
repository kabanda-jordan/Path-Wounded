import type { Request, Response } from 'express'
import * as vehiclesService from './vehicles.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function listVehicles(req: Request, res: Response) {
  const vehicles = await vehiclesService.listVehicles(req.params.carrierId as string)
  return sendSuccess(res, vehicles)
}

export async function getVehicle(req: Request, res: Response) {
  const vehicle = await vehiclesService.getVehicle(req.params.id as string)
  if (!vehicle) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } })
  return sendSuccess(res, vehicle)
}

export async function createVehicle(req: Request, res: Response) {
  const vehicle = await vehiclesService.createVehicle(req.params.carrierId as string, req.body)
  return sendSuccess(res, vehicle, 201)
}

export async function updateVehicle(req: Request, res: Response) {
  const vehicle = await vehiclesService.updateVehicle(req.params.id as string, req.body)
  return sendSuccess(res, vehicle)
}

export async function deleteVehicle(req: Request, res: Response) {
  await vehiclesService.deleteVehicle(req.params.id as string)
  return sendSuccess(res, { message: 'Vehicle deleted' })
}

export async function getVehicleBreakdown(_req: Request, res: Response) {
  const breakdown = await vehiclesService.getVehicleBreakdown()
  return sendSuccess(res, breakdown)
}
