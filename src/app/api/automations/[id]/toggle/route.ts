import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const automation = await prisma.automation.findUnique({ where: { id } })
    if (!automation) {
      return sendError(404, 'NOT_FOUND', 'Automation not found')
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    })

    return sendSuccess(updated)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
