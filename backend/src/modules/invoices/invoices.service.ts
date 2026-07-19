import { prisma } from '../../config/database.js'
import { parsePagination, buildPaginationMeta } from '../../utils/pagination.js'
import type { Prisma } from '@prisma/client'

export async function listInvoices(query: { page?: number; limit?: number; status?: string }) {
  const { page, limit, skip } = parsePagination(query)
  const where: Prisma.InvoiceWhereInput = {}
  if (query.status) where.status = query.status as any

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where, skip, take: limit,
      include: {
        order: { select: { id: true, orderNumber: true } },
        carrier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ])
  return { invoices, meta: buildPaginationMeta(total, page, limit) }
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { order: true, carrier: { select: { id: true, name: true } } },
  })
}

export async function createInvoice(data: Prisma.InvoiceCreateInput) {
  return prisma.invoice.create({ data })
}

export async function markPaid(id: string) {
  return prisma.invoice.update({
    where: { id },
    data: { status: 'paid', paidAt: new Date() },
  })
}

export async function detectOverdue() {
  const result = await prisma.invoice.updateMany({
    where: { status: 'unpaid', dueDate: { lt: new Date() } },
    data: { status: 'overdue' },
  })
  return result.count
}
