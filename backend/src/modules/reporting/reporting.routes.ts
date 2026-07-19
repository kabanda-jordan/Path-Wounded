import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import * as reportingController from './reporting.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /reporting/carriers:
 *   get:
 *     tags: [Reporting]
 *     summary: Get carrier performance report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrier performance data
 */
router.get('/carriers', asyncHandler(reportingController.carrierPerformance))

/**
 * @swagger
 * /reporting/carriers/export:
 *   get:
 *     tags: [Reporting]
 *     summary: Export carrier performance as CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/carriers/export', asyncHandler(reportingController.exportCarrierCSV))

export default router
