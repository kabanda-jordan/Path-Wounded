import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'
import { parsePagination, buildPaginationMeta } from '@/lib/pagination'

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  orderId: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id: carrierId } = await params
    const { page, limit, offset } = parsePagination(request.nextUrl)

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { carrierId },
        skip: offset,
        take: limit,
        include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { carrierId } }),
    ])

    return sendSuccess(reviews, 200, buildPaginationMeta(total, page, limit))
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id: carrierId } = await params
    const body = await request.json()
    const validation = validate(createReviewSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const { rating, comment, orderId } = validation.data

    const existing = await prisma.review.findFirst({
      where: { authorId: user.userId, carrierId, orderId: orderId || null },
    })
    if (existing) {
      return sendError(409, 'REVIEW_EXISTS', 'You have already reviewed this carrier for this order')
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          authorId: user.userId,
          carrierId,
          rating,
          comment: comment || null,
          orderId: orderId || null,
        },
      })

      const agg = await tx.review.aggregate({ where: { carrierId }, _avg: { rating: true } })
      await tx.carrier.update({ where: { id: carrierId }, data: { rating: agg._avg.rating || 0 } })

      return newReview
    })

    return sendSuccess(review, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
