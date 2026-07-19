import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'
import { sendError } from '../utils/response.js'

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const details = result.error.flatten().fieldErrors
      return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details)
    }
    req[source] = result.data
    next()
  }
}
