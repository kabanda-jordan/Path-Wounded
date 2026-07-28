import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const updateCarrierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().max(200).optional(),
  logoUrl: z.string().url().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        vehicles: true,
        partners: true,
        reviews: {
          include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { vehicles: true, partners: true, orders: true } },
      },
    })

    if (!carrier) {
      return sendError(404, 'NOT_FOUND', 'Carrier not found')
    }

    return sendSuccess(carrier)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')
    if (user.role !== 'admin') return sendError(403, 'FORBIDDEN', 'Insufficient permissions')

    const { id } = await params
    const body = await request.json()
    const validation = validate(updateCarrierSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const carrier = await prisma.carrier.update({ where: { id }, data: validation.data })
    return sendSuccess(carrier)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
