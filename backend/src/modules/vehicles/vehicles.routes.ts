import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { createVehicleSchema, updateVehicleSchema } from './vehicles.validation.js'
import * as vehiclesController from './vehicles.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /vehicles/breakdown:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle type breakdown statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle breakdown by type
 */
router.get('/breakdown', asyncHandler(vehiclesController.getVehicleBreakdown))

/**
 * @swagger
 * /vehicles/carrier/{carrierId}:
 *   get:
 *     tags: [Vehicles]
 *     summary: List vehicles for a specific carrier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carrierId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicles list
 */
router.get('/carrier/:carrierId', asyncHandler(vehiclesController.listVehicles))

/**
 * @swagger
 * /vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle details
 */
router.get('/:id', asyncHandler(vehiclesController.getVehicle))

/**
 * @swagger
 * /vehicles/carrier/{carrierId}:
 *   post:
 *     tags: [Vehicles]
 *     summary: Add a vehicle to a carrier
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
 *             $ref: '#/components/schemas/CreateVehicleRequest'
 *     responses:
 *       201:
 *         description: Vehicle created
 */
router.post('/carrier/:carrierId', requireRole(['admin', 'carrier']), validate(createVehicleSchema), asyncHandler(vehiclesController.createVehicle))

/**
 * @swagger
 * /vehicles/{id}:
 *   patch:
 *     tags: [Vehicles]
 *     summary: Update a vehicle
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
 *             $ref: '#/components/schemas/CreateVehicleRequest'
 *     responses:
 *       200:
 *         description: Vehicle updated
 */
router.patch('/:id', requireRole(['admin', 'carrier']), validate(updateVehicleSchema), asyncHandler(vehiclesController.updateVehicle))

/**
 * @swagger
 * /vehicles/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Delete a vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vehicle deleted
 */
router.delete('/:id', requireRole(['admin', 'carrier']), asyncHandler(vehiclesController.deleteVehicle))

export default router
