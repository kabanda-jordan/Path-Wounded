import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  triggerType: z.enum(['order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received']),
  actionType: z.enum(['send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message']),
  config: z.record(z.any()).optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const automations = await prisma.automation.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    })

    return sendSuccess(automations)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const body = await request.json()
    const validation = validate(createAutomationSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const automation = await prisma.automation.create({
      data: {
        userId: user.userId,
        name: validation.data.name,
        triggerType: validation.data.triggerType,
        actionType: validation.data.actionType,
        config: validation.data.config || {},
      },
    })

    return sendSuccess(automation, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
