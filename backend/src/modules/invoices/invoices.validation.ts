import { z } from 'zod'

export const createInvoiceSchema = z.object({
  orderId: z.string().uuid(),
  carrierId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  dueDate: z.string().transform((s) => new Date(s)),
})

export const listInvoicesSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(['unpaid', 'paid', 'overdue']).optional(),
})
