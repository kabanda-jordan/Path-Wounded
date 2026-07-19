import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { asyncHandler } from '../../middleware/errorHandler.js'
import { updateProfileSchema, changePasswordSchema } from './users.validation.js'
import * as usersController from './users.controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

router.use(authenticate)

/**
 * @swagger
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', asyncHandler(usersController.getProfile))

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/profile', validate(updateProfileSchema), asyncHandler(usersController.updateProfile))

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password is incorrect
 */
router.post('/change-password', validate(changePasswordSchema), asyncHandler(usersController.changePassword))

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload avatar image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.post('/avatar', upload.single('avatar'), asyncHandler(usersController.uploadAvatar))

export default router
