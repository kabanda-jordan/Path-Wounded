import { prisma } from '../../config/database.js'

export async function getCarrierPerformanceReport() {
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

  return carriers.map((c) => ({
    id: c.id,
    name: c.name,
    rating: c.rating,
    totalOrders: c._count.orders,
    deliveredOrders: c.orders.length,
    totalRevenue: c.orders.reduce((sum, o) => sum + Number(o.amountPaid), 0),
    avgHoursOnRoad: c.orders.length > 0
      ? Math.round(c.orders.reduce((sum, o) => sum + (o.hoursOnRoad || 0), 0) / c.orders.length * 10) / 10
      : 0,
    vehicleCount: c._count.vehicles,
    reviewCount: c._count.reviews,
  }))
}

export async function exportCSV(data: Record<string, any>[], headers: string[]): Promise<string> {
  const lines = [headers.join(',')]
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h]
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val ?? ''
    })
    lines.push(values.join(','))
  }
  return lines.join('\n')
}
