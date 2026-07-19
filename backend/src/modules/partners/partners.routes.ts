import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import * as partnersController from './partners.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /partners/carrier/{carrierId}:
 *   get:
 *     tags: [Partners]
 *     summary: List partners for a carrier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carrierId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Partners list
 */
router.get('/carrier/:carrierId', asyncHandler(partnersController.listPartners))

/**
 * @swagger
 * /partners/carrier/{carrierId}:
 *   post:
 *     tags: [Partners]
 *     summary: Create a partner for a carrier
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
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Partner created
 */
router.post('/carrier/:carrierId', asyncHandler(partnersController.createPartner))

/**
 * @swagger
 * /partners/{id}:
 *   delete:
 *     tags: [Partners]
 *     summary: Delete a partner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Partner deleted
 */
router.delete('/:id', asyncHandler(partnersController.deletePartner))

export default router
