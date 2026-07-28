import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10)

    const carriers = await prisma.carrier.findMany({
      where: { status: 'active' },
      orderBy: { rating: 'desc' },
      take: limit,
      include: { _count: { select: { vehicles: true, orders: true } } },
    })

    return sendSuccess(carriers)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
