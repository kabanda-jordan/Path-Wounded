import { z } from 'zod'
import { prisma } from '../../config/database.js'

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  triggerType: z.enum(['order_delivered', 'order_created', 'order_cancelled', 'invoice_overdue', 'payment_received']),
  actionType: z.enum(['send_email', 'send_notification', 'create_invoice', 'update_status', 'send_message']),
  config: z.record(z.any()).optional(),
})

export const updateAutomationSchema = createAutomationSchema.partial()

export async function listAutomations(userId: string) {
  return prisma.automation.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
}

export async function getAutomation(id: string) {
  return prisma.automation.findUnique({ where: { id } })
}

export async function createAutomation(userId: string, data: any) {
  return prisma.automation.create({ data: { ...data, userId } })
}

export async function updateAutomation(id: string, data: any) {
  return prisma.automation.update({ where: { id }, data })
}

export async function deleteAutomation(id: string) {
  return prisma.automation.delete({ where: { id } })
}

export async function toggleAutomation(id: string) {
  const automation = await prisma.automation.findUniqueOrThrow({ where: { id } })
  return prisma.automation.update({ where: { id }, data: { isActive: !automation.isActive } })
}
