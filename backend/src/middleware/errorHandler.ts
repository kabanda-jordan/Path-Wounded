import type { Request, Response, NextFunction } from 'express'
import { sendError } from '../utils/response.js'
import { logger } from '../utils/logger.js'
import { ZodError } from 'zod'

class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message)
    this.name = 'AppError'
  }
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, requestId: req.headers['x-request-id'] }, 'Unhandled error')

  if (err instanceof ZodError) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', err.flatten().fieldErrors)
  }

  if (err instanceof AppError || (err as any).statusCode) {
    const e = err as any
    return sendError(res, e.statusCode || 500, e.code || 'ERROR', e.message)
  }

  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred')
}
