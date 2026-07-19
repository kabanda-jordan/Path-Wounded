import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import * as notificationsController from './notifications.controller.js'

const router = Router()
router.use(authenticate)

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', asyncHandler(notificationsController.unreadCount))

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Notifications list
 */
router.get('/', asyncHandler(notificationsController.list))

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked read
 */
router.post('/mark-all-read', asyncHandler(notificationsController.markAllRead))

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marked read
 */
router.post('/:id/read', asyncHandler(notificationsController.markRead))

export default router
