import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const range = request.nextUrl.searchParams.get('range') || '30d'
    let days = 30
    if (range === '7d') days = 7
    else if (range === '90d') days = 90
    else if (range === '12m') days = 365

    const now = new Date()
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
      if (!inv.paidAt) continue
      const key = inv.paidAt.toISOString().split('T')[0]
      if (daily[key] !== undefined) {
        daily[key] += Number(inv.amount)
      }
    }

    const data = Object.entries(daily).map(([date, revenue]) => ({ date, revenue }))
    return sendSuccess(data)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
