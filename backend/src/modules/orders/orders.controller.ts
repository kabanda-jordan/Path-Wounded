import type { Request, Response } from 'express'
import * as ordersService from './orders.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function listOrders(req: Request, res: Response) {
  const result = await ordersService.listOrders(req.query as any)
  return sendSuccess(res, result.orders, 200, result.meta)
}

export async function getOrder(req: Request, res: Response) {
  const order = await ordersService.getOrder(req.params.id as string)
  if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
  return sendSuccess(res, order)
}

export async function createOrder(req: Request, res: Response) {
  const order = await ordersService.createOrder(req.user!.userId, req.body)
  return sendSuccess(res, order, 201)
}

export async function updateOrder(req: Request, res: Response) {
  const order = await ordersService.updateOrder(req.params.id as string, req.body)
  return sendSuccess(res, order)
}

export async function cancelOrder(req: Request, res: Response) {
  const order = await ordersService.cancelOrder(req.params.id as string)
  return sendSuccess(res, order)
}

export async function getOrderStats(_req: Request, res: Response) {
  const stats = await ordersService.getOrderStats()
  return sendSuccess(res, stats)
}
