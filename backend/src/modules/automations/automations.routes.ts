import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { createAutomationSchema, updateAutomationSchema } from './automations.service.js'
import * as automationsController from './automations.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /automations:
 *   get:
 *     tags: [Automations]
 *     summary: List automation rules for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Automations list
 */
router.get('/', asyncHandler(automationsController.list))

/**
 * @swagger
 * /automations/{id}:
 *   get:
 *     tags: [Automations]
 *     summary: Get automation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Automation details
 */
router.get('/:id', asyncHandler(automationsController.get))

/**
 * @swagger
 * /automations:
 *   post:
 *     tags: [Automations]
 *     summary: Create an automation rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAutomationRequest'
 *     responses:
 *       201:
 *         description: Automation created
 */
router.post('/', validate(createAutomationSchema), asyncHandler(automationsController.create))

/**
 * @swagger
 * /automations/{id}:
 *   patch:
 *     tags: [Automations]
 *     summary: Update an automation rule
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
 *             $ref: '#/components/schemas/CreateAutomationRequest'
 *     responses:
 *       200:
 *         description: Automation updated
 */
router.patch('/:id', validate(updateAutomationSchema), asyncHandler(automationsController.update))

/**
 * @swagger
 * /automations/{id}:
 *   delete:
 *     tags: [Automations]
 *     summary: Delete an automation rule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Automation deleted
 */
router.delete('/:id', asyncHandler(automationsController.remove))

/**
 * @swagger
 * /automations/{id}/toggle:
 *   post:
 *     tags: [Automations]
 *     summary: Toggle automation active/inactive
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Automation toggled
 */
router.post('/:id/toggle', asyncHandler(automationsController.toggle))

export default router
