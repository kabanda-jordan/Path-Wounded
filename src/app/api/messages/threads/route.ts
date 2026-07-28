import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: user.userId }, { recipientId: user.userId }] },
      orderBy: { createdAt: 'desc' },
      distinct: ['threadId'],
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
        recipient: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    })

    return sendSuccess(messages)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
