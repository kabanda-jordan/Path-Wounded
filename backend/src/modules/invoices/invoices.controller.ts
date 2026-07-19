import type { Request, Response } from 'express'
import * as invoicesService from './invoices.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function listInvoices(req: Request, res: Response) {
  const result = await invoicesService.listInvoices(req.query as any)
  return sendSuccess(res, result.invoices, 200, result.meta)
}

export async function getInvoice(req: Request, res: Response) {
  const invoice = await invoicesService.getInvoice(req.params.id as string)
  if (!invoice) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } })
  return sendSuccess(res, invoice)
}

export async function createInvoice(req: Request, res: Response) {
  const invoice = await invoicesService.createInvoice(req.body)
  return sendSuccess(res, invoice, 201)
}

export async function markPaid(req: Request, res: Response) {
  const invoice = await invoicesService.markPaid(req.params.id as string)
  return sendSuccess(res, invoice)
}

export async function detectOverdue(_req: Request, res: Response) {
  const count = await invoicesService.detectOverdue()
  return sendSuccess(res, { updated: count })
}
