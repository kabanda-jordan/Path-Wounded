import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const carriers = await prisma.carrier.findMany({
      where: { status: 'active' },
      include: {
        _count: { select: { orders: true, vehicles: true, reviews: true } },
        orders: {
          where: { status: 'delivered' },
          select: { amountPaid: true, hoursOnRoad: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    const report = carriers.map((c) => ({
      id: c.id,
      name: c.name,
      rating: c.rating,
      totalOrders: c._count.orders,
      deliveredOrders: c.orders.length,
      totalRevenue: c.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0),
      avgHoursOnRoad:
        c.orders.length > 0
          ? Math.round(c.orders.reduce((sum, o) => sum + (o.hoursOnRoad || 0), 0) / c.orders.length * 10) / 10
          : 0,
      vehicleCount: c._count.vehicles,
      reviewCount: c._count.reviews,
    }))

    return sendSuccess(report)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
