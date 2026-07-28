import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSuccess, sendError } from '@/lib/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return sendError(401, 'UNAUTHORIZED', 'Authentication required')

    const { id } = await params

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { order: true, carrier: { select: { id: true, name: true } } },
    })

    if (!invoice) {
      return sendError(404, 'NOT_FOUND', 'Invoice not found')
    }

    return sendSuccess(invoice)
  } catch {
    return sendError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}
