import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const [totalOrders, deliveredOrders, activeOrders, revenueResult, avgHoursResult, activeCarriers, pendingOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'delivered' } }),
        prisma.order.count({ where: { status: { in: ['pending', 'assigned', 'in_transit'] } } }),
        prisma.order.aggregate({ _sum: { amountPaid: true }, where: { status: 'delivered' } }),
        prisma.order.aggregate({ _avg: { hoursOnRoad: true }, where: { status: 'delivered' } }),
        prisma.carrier.count({ where: { status: 'active' } }),
        prisma.order.count({ where: { status: 'pending' } }),
      ])

    return sendSuccess({
      totalOrders,
      deliveredOrders,
      activeOrders,
      pendingOrders,
      totalRevenue: Number(revenueResult._sum.amountPaid) || 0,
      avgHoursOnRoad: Math.round((avgHoursResult._avg.hoursOnRoad || 0) * 10) / 10,
      activeCarriers,
    })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
