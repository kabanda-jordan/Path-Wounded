import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import * as analyticsController from './analytics.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Get dashboard overview statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OverviewStats'
 */
router.get('/overview', asyncHandler(analyticsController.getOverview))

/**
 * @swagger
 * /analytics/revenue:
 *   get:
 *     tags: [Analytics]
 *     summary: Get revenue over time
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Time range for revenue data
 *     responses:
 *       200:
 *         description: Revenue data points
 */
router.get('/revenue', asyncHandler(analyticsController.getRevenueOverTime))

/**
 * @swagger
 * /analytics/vehicle-breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Get vehicle type breakdown
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle breakdown
 */
router.get('/vehicle-breakdown', asyncHandler(analyticsController.getVehicleBreakdown))

/**
 * @swagger
 * /analytics/order-status-breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Get order status distribution
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order status breakdown
 */
router.get('/order-status-breakdown', asyncHandler(analyticsController.getOrderStatusBreakdown))

export default router
