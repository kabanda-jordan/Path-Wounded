import { z } from 'zod'
import { prisma } from '../../config/database.js'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js'

export const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  threadId: z.string().uuid().optional(),
})

export async function sendMessage(senderId: string, data: { recipientId: string; body: string; threadId?: string }) {
  const threadId = data.threadId || crypto.randomUUID()
  return prisma.message.create({
    data: { senderId, recipientId: data.recipientId, body: data.body, threadId },
  })
}

export async function getThread(threadId: string) {
  return prisma.message.findMany({
    where: { threadId },
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
      recipient: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getUserThreads(userId: string) {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: 'desc' },
    distinct: ['threadId'],
    include: {
      sender: { select: { id: true, fullName: true, avatarUrl: true } },
      recipient: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  })
  return messages
}

export async function markRead(threadId: string, userId: string) {
  return prisma.message.updateMany({
    where: { threadId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  })
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.message.count({
    where: { recipientId: userId, readAt: null },
  })
  return count
}
