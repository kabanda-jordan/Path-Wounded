import { prisma } from '../../config/database.js'
import { generateOrderNumber } from '../../utils/crypto.js'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js'
import { ORDER_STATUS_TRANSITIONS } from '../../config/constants.js'
import type { Prisma } from '@prisma/client'

export async function listOrders(query: {
  page?: number; limit?: number; status?: string; carrierId?: string;
  startDate?: string; endDate?: string; search?: string;
}, brokerId?: string) {
  const { page, limit, skip } = parsePagination(query)

  const where: Prisma.OrderWhereInput = {}
  if (brokerId) where.brokerId = brokerId
  if (query.status) where.status = query.status as any
  if (query.carrierId) where.carrierId = query.carrierId
  if (query.startDate || query.endDate) {
    where.createdAt = {}
    if (query.startDate) where.createdAt.gte = new Date(query.startDate)
    if (query.endDate) where.createdAt.lte = new Date(query.endDate)
  }
  if (query.search) {
    where.OR = [
      { orderNumber: { contains: query.search, mode: 'insensitive' } },
      { originAddress: { contains: query.search, mode: 'insensitive' } },
      { destinationAddress: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip, take: limit,
      include: { carrier: { select: { id: true, name: true, rating: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, meta: buildPaginationMeta(total, page, limit) }
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      carrier: { select: { id: true, name: true, rating: true, location: true } },
      invoices: true,
    },
  })
}

export async function createOrder(brokerId: string, data: {
  carrierId?: string; originAddress: string; destinationAddress: string; amountPaid?: number;
}) {
  return prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      brokerId,
      carrierId: data.carrierId,
      originAddress: data.originAddress,
      destinationAddress: data.destinationAddress,
      amountPaid: data.amountPaid || 0,
    },
  })
}

export async function updateOrder(id: string, data: Record<string, any>) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id } })

  if (data.status && data.status !== order.status) {
    const allowed = ORDER_STATUS_TRANSITIONS[order.status] || []
    if (!allowed.includes(data.status)) {
      throw new AppError(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from "${order.status}" to "${data.status}"`,
        400
      )
    }
  }

  if (data.status === 'delivered') {
    data.deliveredAt = new Date()
  }

  return prisma.order.update({ where: { id }, data })
}

export async function cancelOrder(id: string) {
  return updateOrder(id, { status: 'cancelled' })
}

export async function getOrderStats() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [totalOrders, deliveredOrders, activeOrders, totalRevenue, avgHours, activeCarriers] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'delivered' } }),
      prisma.order.count({ where: { status: { in: ['pending', 'assigned', 'in_transit'] } } }),
      prisma.order.aggregate({ _sum: { amountPaid: true }, where: { status: 'delivered' } }),
      prisma.order.aggregate({ _avg: { hoursOnRoad: true }, where: { status: 'delivered' } }),
      prisma.carrier.count({ where: { status: 'active' } }),
    ])

  return {
    totalOrders,
    deliveredOrders,
    activeOrders,
    totalRevenue: totalRevenue._sum.amountPaid || 0,
    avgHoursOnRoad: avgHours._avg.hoursOnRoad || 0,
    activeCarriers,
  }
}

class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message); this.name = 'AppError'
  }
}
