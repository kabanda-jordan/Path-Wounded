import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const statuses = await prisma.order.groupBy({ by: ['status'], _count: { status: true } })
    const total = statuses.reduce((sum, s) => sum + s._count.status, 0)
    const breakdown = statuses.map((s) => ({
      status: s.status,
      count: s._count.status,
      percentage: total > 0 ? Math.round((s._count.status / total) * 100) : 0,
    }))

    return sendSuccess(breakdown)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
