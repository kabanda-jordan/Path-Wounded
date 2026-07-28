import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'
import { validate } from '@/lib/validate'
import { parsePagination, buildPaginationMeta } from '@/lib/pagination'

const createInvoiceSchema = z.object({
  orderId: z.string().uuid(),
  carrierId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  dueDate: z.string().transform((s) => new Date(s)),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { page, limit, offset } = parsePagination(request.nextUrl)
    const status = request.nextUrl.searchParams.get('status')

    const where: Record<string, any> = {}
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          order: { select: { id: true, orderNumber: true } },
          carrier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ])

    return sendSuccess(invoices, 200, buildPaginationMeta(total, page, limit))
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const body = await request.json()
    const validation = validate(createInvoiceSchema, body)
    if (!validation.success) {
      return sendError(400, 'VALIDATION_ERROR', JSON.stringify(validation.errors))
    }

    const { orderId, carrierId, amount, dueDate } = validation.data

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        carrierId,
        amount,
        dueDate,
        status: 'unpaid',
      },
    })

    return sendSuccess(invoice, 201)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
