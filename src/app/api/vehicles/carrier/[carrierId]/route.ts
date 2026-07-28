import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const createVehicleSchema = z.object({
  type: z.enum(['truck', 'cargo_van', 'trailer', 'cargo_plane', 'other']),
  identifier: z.string().min(1).max(50),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ carrierId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { carrierId } = await params

    const vehicles = await prisma.vehicle.findMany({
      where: { carrierId },
      orderBy: { id: 'desc' },
    })

    return sendSuccess(vehicles)
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
    if (!['admin', 'carrier'].includes(user.role)) {
      return sendError(403, 'FORBIDDEN', 'Insufficient permissions')
    }

    const { carrierId } = await params
    const body = await request.json()
    const validation = validate(createVehicleSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const vehicle = await prisma.$transaction(async (tx) => {
      const v = await tx.vehicle.create({
        data: { ...validation.data, carrierId, status: validation.data.status || 'active' } as any,
      })
      await tx.carrier.update({ where: { id: carrierId }, data: { vehicleCount: { increment: 1 } } })
      return v
    })

    return sendSuccess(vehicle, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
