import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).optional(),
  carrierId: z.string().uuid().optional(),
  originAddress: z.string().min(1).optional(),
  destinationAddress: z.string().min(1).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  hoursOnRoad: z.coerce.number().min(0).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        carrier: { select: { id: true, name: true, rating: true, location: true } },
        invoices: true,
      },
    })

    if (!order) {
      return sendError(404, 'NOT_FOUND', 'Order not found')
    }

    return sendSuccess(order)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params
    const body = await request.json()
    const validation = validate(updateOrderSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return sendError(404, 'NOT_FOUND', 'Order not found')
    }

    const data = validation.data

    if (data.status && data.status !== order.status) {
      const allowed = ORDER_STATUS_TRANSITIONS[order.status] || []
      if (!allowed.includes(data.status)) {
        return sendError(
          400,
          'INVALID_STATUS_TRANSITION',
          `Cannot transition from "${order.status}" to "${data.status}"`
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (data.status) updateData.status = data.status
    if (data.carrierId) updateData.carrierId = data.carrierId
    if (data.originAddress) updateData.originAddress = data.originAddress
    if (data.destinationAddress) updateData.destinationAddress = data.destinationAddress
    if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid
    if (data.hoursOnRoad !== undefined) updateData.hoursOnRoad = data.hoursOnRoad

    if (data.status === 'delivered') {
      updateData.deliveredAt = new Date()
    }

    const updated = await prisma.order.update({ where: { id }, data: updateData })
    return sendSuccess(updated)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
