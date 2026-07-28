import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { threadId } = await params

    const messages = await prisma.message.findMany({
      where: { threadId },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return sendSuccess(messages)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
