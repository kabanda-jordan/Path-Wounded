import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  triggerType: z.enum(['order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received']).optional(),
  actionType: z.enum(['send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message']).optional(),
  config: z.record(z.any()).optional(),
})

export async function GET(
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

    return sendSuccess(automation)
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

    const { id } = await params
    const body = await request.json()
    const validation = validate(updateAutomationSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const automation = await prisma.automation.update({ where: { id }, data: validation.data })
    return sendSuccess(automation)
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

    const { id } = await params

    await prisma.automation.delete({ where: { id } })
    return sendSuccess({ message: 'Automation deleted' })
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
