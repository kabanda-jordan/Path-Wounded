import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const [totalOrders, deliveredOrders, activeOrders, totalRevenue, avgHours, activeCarriers] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'delivered' } }),
        prisma.order.count({ where: { status: { in: ['pending', 'assigned', 'in_transit'] } } }),
        prisma.order.aggregate({ _sum: { amountPaid: true }, where: { status: 'delivered' } }),
        prisma.order.aggregate({ _avg: { hoursOnRoad: true }, where: { status: 'delivered' } }),
        prisma.carrier.count({ where: { status: 'active' } }),
      ])

    return sendSuccess({
      totalOrders,
      deliveredOrders,
      activeOrders,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      avgHoursOnRoad: avgHours._avg.hoursOnRoad || 0,
      activeCarriers,
    })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
