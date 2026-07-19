import type { Request, Response } from 'express'
import * as reportingService from './reporting.service.js'
import { sendSuccess } from '../../utils/response.js'

export async function carrierPerformance(_req: Request, res: Response) {
  const report = await reportingService.getCarrierPerformanceReport()
  return sendSuccess(res, report)
}

export async function exportCarrierCSV(_req: Request, res: Response) {
  const report = await reportingService.getCarrierPerformanceReport()
  const headers = ['name', 'rating', 'totalOrders', 'deliveredOrders', 'totalRevenue', 'avgHoursOnRoad', 'vehicleCount']
  const csv = await reportingService.exportCSV(report, headers)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=carrier-performance.csv')
  return res.send(csv)
}
