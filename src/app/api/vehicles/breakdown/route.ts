import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const vehicles = await prisma.vehicle.groupBy({ by: ['type'], _count: { type: true } })
    const total = vehicles.reduce((sum, v) => sum + v._count.type, 0)
    const breakdown = vehicles.map((v) => ({
      type: v.type,
      count: v._count.type,
      percentage: total > 0 ? Math.round((v._count.type / total) * 100) : 0,
    }))

    return sendSuccess(breakdown)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
