import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'
import { parsePagination, buildPaginationMeta } from '@/lib/pagination'

const createCarrierSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  logoUrl: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { page, limit, offset } = parsePagination(request.nextUrl)
    const search = request.nextUrl.searchParams.get('search')

    const where: Record<string, any> = { status: 'active' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [carriers, total] = await Promise.all([
      prisma.carrier.findMany({
        where,
        skip: offset,
        take: limit,
        include: { _count: { select: { vehicles: true, partners: true, orders: true } } },
        orderBy: { rating: 'desc' },
      }),
      prisma.carrier.count({ where }),
    ])

    const result = carriers.map((c) => ({
      ...c,
      vehicleCount: c._count.vehicles,
      partnerCount: c._count.partners,
      orderCount: c._count.orders,
      _count: undefined,
    }))

    return sendSuccess(result, 200, buildPaginationMeta(total, page, limit))
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')
    if (user.role !== 'admin') return sendError(403, 'FORBIDDEN', 'Insufficient permissions')

    const body = await request.json()
    const validation = validate(createCarrierSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const carrier = await prisma.carrier.create({ data: validation.data })
    return sendSuccess(carrier, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
