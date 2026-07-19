import { z } from 'zod'

export const createCarrierSchema = z.object({
  name: z.string().min(1).max(200),
  location: z.string().max(200).optional(),
  logoUrl: z.string().url().optional(),
})

export const updateCarrierSchema = createCarrierSchema.partial()

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  orderId: z.string().uuid().optional(),
})
