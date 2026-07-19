import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { sendMessageSchema } from './messages.service.js'
import * as messagesController from './messages.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     tags: [Messages]
 *     summary: Get unread message count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', asyncHandler(messagesController.unreadCount))

/**
 * @swagger
 * /messages/threads:
 *   get:
 *     tags: [Messages]
 *     summary: Get all message threads for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of threads with latest message
 */
router.get('/threads', asyncHandler(messagesController.getThreads))

/**
 * @swagger
 * /messages/threads/{threadId}:
 *   get:
 *     tags: [Messages]
 *     summary: Get all messages in a thread
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Messages in thread
 */
router.get('/threads/:threadId', asyncHandler(messagesController.getThread))

/**
 * @swagger
 * /messages/threads/{threadId}/read:
 *   post:
 *     tags: [Messages]
 *     summary: Mark all messages in thread as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.post('/threads/:threadId/read', asyncHandler(messagesController.markRead))

/**
 * @swagger
 * /messages:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/', validate(sendMessageSchema), asyncHandler(messagesController.send))

export default router
