import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  companyName: z.string().max(100).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
    'Password must include uppercase, lowercase, number, and special character'
  ),
})
