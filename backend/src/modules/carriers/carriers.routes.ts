import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { createCarrierSchema, updateCarrierSchema, createReviewSchema } from './carriers.validation.js'
import * as carriersController from './carriers.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /carriers:
 *   get:
 *     tags: [Carriers]
 *     summary: List all carriers
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
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated carriers list
 */
router.get('/', asyncHandler(carriersController.listCarriers))

/**
 * @swagger
 * /carriers/top:
 *   get:
 *     tags: [Carriers]
 *     summary: Get top-rated carriers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top carriers
 */
router.get('/top', asyncHandler(carriersController.getTopCarriers))

/**
 * @swagger
 * /carriers/{id}:
 *   get:
 *     tags: [Carriers]
 *     summary: Get carrier by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Carrier details
 */
router.get('/:id', asyncHandler(carriersController.getCarrier))

/**
 * @swagger
 * /carriers:
 *   post:
 *     tags: [Carriers]
 *     summary: Create a new carrier (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarrierRequest'
 *     responses:
 *       201:
 *         description: Carrier created
 *       403:
 *         description: Admin role required
 */
router.post('/', requireRole(['admin']), validate(createCarrierSchema), asyncHandler(carriersController.createCarrier))

/**
 * @swagger
 * /carriers/{id}:
 *   patch:
 *     tags: [Carriers]
 *     summary: Update a carrier (admin only)
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
 *             $ref: '#/components/schemas/CreateCarrierRequest'
 *     responses:
 *       200:
 *         description: Carrier updated
 */
router.patch('/:id', requireRole(['admin']), validate(updateCarrierSchema), asyncHandler(carriersController.updateCarrier))

/**
 * @swagger
 * /carriers/{carrierId}/reviews:
 *   post:
 *     tags: [Carriers]
 *     summary: Add a review for a carrier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carrierId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/:carrierId/reviews', validate(createReviewSchema), asyncHandler(carriersController.createReview))

/**
 * @swagger
 * /carriers/{carrierId}/reviews:
 *   get:
 *     tags: [Carriers]
 *     summary: Get reviews for a carrier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carrierId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Reviews list
 */
router.get('/:carrierId/reviews', asyncHandler(carriersController.getReviews))

export default router
