import { z } from 'zod'

export const createOrderSchema = z.object({
  carrierId: z.string().uuid().optional(),
  originAddress: z.string().min(1, 'Origin address is required'),
  destinationAddress: z.string().min(1, 'Destination address is required'),
  amountPaid: z.coerce.number().min(0).optional(),
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).optional(),
  carrierId: z.string().uuid().optional(),
  originAddress: z.string().min(1).optional(),
  destinationAddress: z.string().min(1).optional(),
  amountPaid: z.coerce.number().min(0).optional(),
  hoursOnRoad: z.coerce.number().min(0).optional(),
})

export const listOrdersSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).optional(),
  carrierId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})
