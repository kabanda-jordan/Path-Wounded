import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'
import { parsePagination, buildPaginationMeta } from '@/lib/pagination'

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

const createOrderSchema = z.object({
  carrierId: z.string().uuid().optional(),
  originAddress: z.string().min(1, 'Origin address is required'),
  destinationAddress: z.string().min(1, 'Destination address is required'),
  amountPaid: z.coerce.number().min(0).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { page, limit, offset } = parsePagination(request.nextUrl)
    const searchParams = request.nextUrl.searchParams

    const where: Record<string, any> = {}
    const status = searchParams.get('status')
    const carrierId = searchParams.get('carrierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    if (status) where.status = status
    if (carrierId) where.carrierId = carrierId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { originAddress: { contains: search, mode: 'insensitive' } },
        { destinationAddress: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: offset,
        take: limit,
        include: { carrier: { select: { id: true, name: true, rating: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ])

    return sendSuccess(orders, 200, buildPaginationMeta(total, page, limit))
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const body = await request.json()
    const validation = validate(createOrderSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const { carrierId, originAddress, destinationAddress, amountPaid } = validation.data

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        brokerId: user.userId,
        carrierId: carrierId || null,
        originAddress: originAddress,
        destinationAddress: destinationAddress,
        amountPaid: amountPaid || 0,
        status: 'pending',
      },
    })

    return sendSuccess(order, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
