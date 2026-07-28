import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const updateVehicleSchema = z.object({
  type: z.enum(['truck', 'cargo_van', 'trailer', 'cargo_plane', 'other']).optional(),
  identifier: z.string().min(1).max(50).optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) {
      return sendError(404, 'NOT_FOUND', 'Vehicle not found')
    }

    return sendSuccess(vehicle)
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
    if (!['admin', 'carrier'].includes(user.role)) {
      return sendError(403, 'FORBIDDEN', 'Insufficient permissions')
    }

    const { id } = await params
    const body = await request.json()
    const validation = validate(updateVehicleSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data: validation.data })
    return sendSuccess(vehicle)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')
    if (!['admin', 'carrier'].includes(user.role)) {
      return sendError(403, 'FORBIDDEN', 'Insufficient permissions')
    }

    const { id } = await params

    const vehicle = await prisma.vehicle.findUnique({ where: { id } })
    if (!vehicle) {
      return sendError(404, 'NOT_FOUND', 'Vehicle not found')
    }

    await prisma.$transaction([
      prisma.vehicle.delete({ where: { id } }),
      prisma.carrier.update({ where: { id: vehicle.carrierId }, data: { vehicleCount: { decrement: 1 } } }),
    ])

    return sendSuccess({ message: 'Vehicle deleted' })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
