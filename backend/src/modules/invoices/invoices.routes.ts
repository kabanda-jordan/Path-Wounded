import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { createInvoiceSchema, listInvoicesSchema } from './invoices.validation.js'
import * as invoicesController from './invoices.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List all invoices (paginated, filterable)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [unpaid, paid, overdue] }
 *     responses:
 *       200:
 *         description: Paginated invoices list
 */
router.get('/', validate(listInvoicesSchema, 'query'), asyncHandler(invoicesController.listInvoices))

/**
 * @swagger
 * /invoices/detect-overdue:
 *   post:
 *     tags: [Invoices]
 *     summary: Detect and mark overdue invoices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Number of invoices updated
 */
router.post('/detect-overdue', asyncHandler(invoicesController.detectOverdue))

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     summary: Get invoice by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice details
 */
router.get('/:id', asyncHandler(invoicesController.getInvoice))

/**
 * @swagger
 * /invoices:
 *   post:
 *     tags: [Invoices]
 *     summary: Create a new invoice
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvoiceRequest'
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/', validate(createInvoiceSchema), asyncHandler(invoicesController.createInvoice))

/**
 * @swagger
 * /invoices/{id}/mark-paid:
 *   post:
 *     tags: [Invoices]
 *     summary: Mark invoice as paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice marked as paid
 */
router.post('/:id/mark-paid', asyncHandler(invoicesController.markPaid))

export default router
