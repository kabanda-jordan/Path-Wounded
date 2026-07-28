import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const partner = await prisma.partner.findUnique({ where: { id } })
    if (!partner) {
      return sendError(404, 'NOT_FOUND', 'Partner not found')
    }

    await prisma.$transaction([
      prisma.partner.delete({ where: { id } }),
      prisma.carrier.update({ where: { id: partner.carrierId }, data: { partnerCount: { decrement: 1 } } }),
    ])

    return sendSuccess({ message: 'Partner deleted' })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
