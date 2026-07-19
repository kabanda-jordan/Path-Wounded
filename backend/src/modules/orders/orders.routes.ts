import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { createOrderSchema, updateOrderSchema, listOrdersSchema } from './orders.validation.js'
import * as ordersController from './orders.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List all orders (paginated, filterable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, assigned, in_transit, delivered, cancelled] }
 *       - in: query
 *         name: carrierId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated orders list
 */
router.get('/', validate(listOrdersSchema, 'query'), asyncHandler(ordersController.listOrders))

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     tags: [Orders]
 *     summary: Get order statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order stats
 */
router.get('/stats', asyncHandler(ordersController.getOrderStats))

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get single order by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', asyncHandler(ordersController.getOrder))

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', validate(createOrderSchema), asyncHandler(ordersController.createOrder))

/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     tags: [Orders]
 *     summary: Update an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderRequest'
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 */
router.patch('/:id', validate(updateOrderSchema), asyncHandler(ordersController.updateOrder))

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel an order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Cannot cancel completed order
 */
router.post('/:id/cancel', asyncHandler(ordersController.cancelOrder))

export default router
