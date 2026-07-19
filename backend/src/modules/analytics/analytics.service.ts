import { prisma } from '../../config/database.js'

export async function getOverview() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

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

  return {
    totalOrders,
    deliveredOrders,
    activeOrders,
    pendingOrders,
    totalRevenue: Number(revenueResult._sum.amountPaid) || 0,
    avgHoursOnRoad: Math.round((avgHoursResult._avg.hoursOnRoad || 0) * 10) / 10,
    activeCarriers,
  }
}

export async function getRevenueOverTime(range: string = '30d') {
  const now = new Date()
  let days = 30
  if (range === '7d') days = 7
  else if (range === '90d') days = 90
  else if (range === '12m') days = 365

  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  const invoices = await prisma.invoice.findMany({
    where: { status: 'paid', paidAt: { gte: startDate } },
    select: { amount: true, paidAt: true },
  })

  const daily: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().split('T')[0]
    daily[key] = 0
  }

  for (const inv of invoices) {
    const key = inv.paidAt!.toISOString().split('T')[0]
    if (daily[key] !== undefined) {
      daily[key] += Number(inv.amount)
    }
  }

  return Object.entries(daily).map(([date, revenue]) => ({ date, revenue }))
}

export async function getVehicleBreakdown() {
  const vehicles = await prisma.vehicle.groupBy({ by: ['type'], _count: { type: true } })
  const total = vehicles.reduce((sum, v) => sum + v._count.type, 0)
  return vehicles.map((v) => ({
    type: v.type,
    count: v._count.type,
    percentage: total > 0 ? Math.round((v._count.type / total) * 100) : 0,
  }))
}

export async function getOrderStatusBreakdown() {
  const statuses = await prisma.order.groupBy({ by: ['status'], _count: { status: true } })
  const total = statuses.reduce((sum, s) => sum + s._count.status, 0)
  return statuses.map((s) => ({
    status: s.status,
    count: s._count.status,
    percentage: total > 0 ? Math.round((s._count.status / total) * 100) : 0,
  }))
}
