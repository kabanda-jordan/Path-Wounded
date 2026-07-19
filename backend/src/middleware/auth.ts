import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { prisma } from '../config/database.js'
import { sendError } from '../utils/response.js'

export interface AuthPayload {
  userId: string
  email: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header')
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload
    req.user = payload
    next()
  } catch {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Access token is invalid or has expired')
  }
}

export function requireRole(roles: readonly string[] | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required')
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action')
    }
    next()
  }
}
