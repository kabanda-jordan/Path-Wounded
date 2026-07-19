import { prisma } from '../../config/database.js'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js'
import type { Prisma } from '@prisma/client'

export async function listCarriers(query: { page?: number; limit?: number; search?: string }) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.CarrierWhereInput = { status: 'active' }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [carriers, total] = await Promise.all([
    prisma.carrier.findMany({
      where, skip, take: limit,
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

  return { carriers: result, meta: buildPaginationMeta(total, page, limit) }
}

export async function getCarrier(id: string) {
  return prisma.carrier.findUnique({
    where: { id },
    include: {
      vehicles: true,
      partners: true,
      reviews: { include: { author: { select: { id: true, fullName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { vehicles: true, partners: true, orders: true } },
    },
  })
}

export async function createCarrier(data: Prisma.CarrierCreateInput) {
  return prisma.carrier.create({ data })
}

export async function updateCarrier(id: string, data: Prisma.CarrierUpdateInput) {
  return prisma.carrier.update({ where: { id }, data })
}

export async function getTopCarriers(limit = 10) {
  return prisma.carrier.findMany({
    where: { status: 'active' },
    orderBy: { rating: 'desc' },
    take: limit,
    include: { _count: { select: { vehicles: true, orders: true } } },
  })
}

export async function createReview(authorId: string, carrierId: string, data: { rating: number; comment?: string; orderId?: string }) {
  const review = await prisma.$transaction(async (tx) => {
    const existing = await tx.review.findFirst({
      where: { authorId, carrierId, orderId: data.orderId || null },
    })
    if (existing) throw new AppError('REVIEW_EXISTS', 'You have already reviewed this carrier for this order', 409)

    const review = await tx.review.create({
      data: { authorId, carrierId, ...data },
    })

    const agg = await tx.review.aggregate({ where: { carrierId }, _avg: { rating: true } })
    await tx.carrier.update({ where: { id: carrierId }, data: { rating: agg._avg.rating || 0 } })

    return review
  })
  return review
}

export async function getReviews(carrierId: string, query: { page?: number; limit?: number }) {
  const { page, limit, skip } = parsePagination(query)
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { carrierId }, skip, take: limit,
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where: { carrierId } }),
  ])
  return { reviews, meta: buildPaginationMeta(total, page, limit) }
}

class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message); this.name = 'AppError'
  }
}
