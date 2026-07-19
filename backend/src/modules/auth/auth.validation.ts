import { z } from 'zod'
import { PASSWORD_REGEX, PASSWORD_MIN_LENGTH } from '../../config/constants.js'

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .regex(PASSWORD_REGEX, 'Password must include uppercase, lowercase, number, and special character'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  companyName: z.string().max(100).optional(),
  role: z.enum(['admin', 'broker', 'carrier', 'dispatcher', 'viewer']).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH)
    .regex(PASSWORD_REGEX, 'Password must include uppercase, lowercase, number, and special character'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
