import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const result = await prisma.invoice.updateMany({
      where: { status: 'unpaid', dueDate: { lt: new Date() } },
      data: { status: 'overdue' },
    })

    return sendSuccess({ updated: result.count })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
