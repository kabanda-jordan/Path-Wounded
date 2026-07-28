import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  threadId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const body = await request.json()
    const validation = validate(sendMessageSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const { recipientId, body: messageBody, threadId } = validation.data
    const resolvedThreadId = threadId || crypto.randomUUID()

    const message = await prisma.message.create({
      data: {
        senderId: user.userId,
        recipientId,
        body: messageBody,
        threadId: resolvedThreadId,
      },
    })

    return sendSuccess(message, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
