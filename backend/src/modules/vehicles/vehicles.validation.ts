import { z } from 'zod'

export const createVehicleSchema = z.object({
  type: z.enum(['truck', 'cargo_van', 'trailer', 'cargo_plane', 'other']),
  identifier: z.string().min(1).max(50),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial()
