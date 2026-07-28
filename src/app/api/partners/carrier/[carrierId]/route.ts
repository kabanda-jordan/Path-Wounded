import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const createPartnerSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['supplier', 'distributor', 'warehouse', 'customs', 'other']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { carrierId } = await params

    const partners = await prisma.partner.findMany({ where: { carrierId } })
    return sendSuccess(partners)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { carrierId } = await params
    const body = await request.json()
    const validation = validate(createPartnerSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const partner = await prisma.$transaction(async (tx) => {
      const p = await tx.partner.create({
        data: {
          carrierId,
          name: validation.data.name,
          type: validation.data.type || 'other',
        },
      })
      await tx.carrier.update({ where: { id: carrierId }, data: { partnerCount: { increment: 1 } } })
      return p
    })

    return sendSuccess(partner, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
