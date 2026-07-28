import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const carriers = await prisma.carrier.findMany({
      where: { status: 'active' },
      include: {
        _count: { select: { orders: true, vehicles: true } },
        orders: {
          where: { status: 'delivered' },
          select: { amountPaid: true, hoursOnRoad: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    const report = carriers.map((c) => ({
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
    }))

    const headers = ['name', 'rating', 'totalOrders', 'deliveredOrders', 'totalRevenue', 'avgHoursOnRoad', 'vehicleCount']
    const csvLines = [headers.join(',')]
    for (const row of report) {
      const values = headers.map((h) => {
        const val = (row as Record<string, any>)[h]
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val ?? ''
      })
      csvLines.push(values.join(','))
    }
    const csv = csvLines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=carrier-performance.csv',
      },
    })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
