import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const result: Record<string, unknown> = {}

  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value
  result.hasCookie = !!token
  result.tokenPrefix = token ? token.substring(0, 30) + '...' : null

  if (!token) {
    result.step = 'NO_COOKIE'
    return Response.json(result)
  }

  const payload = verifyAccessToken(token)
  result.jwtValid = !!payload
  result.jwtPayload = payload ? { userId: payload.userId, email: payload.email, role: payload.role, exp: payload.exp } : null
  result.serverTime = Math.floor(Date.now() / 1000)

  if (!payload) {
    result.step = 'JWT_INVALID'
    result.envHasSecret = !!process.env.JWT_ACCESS_SECRET
    result.secretLength = process.env.JWT_ACCESS_SECRET?.length || 0
    return Response.json(result)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true },
    })
    result.userFound = !!user
    result.userData = user
    result.step = user ? 'SUCCESS' : 'USER_NOT_FOUND'
  } catch (e: unknown) {
    result.prismaError = e instanceof Error ? e.message : String(e)
    result.step = 'PRISMA_ERROR'
  }

  result.envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_ACCESS_SECRET,
    hasEdgeUrl: !!process.env.EDGE_FUNCTION_URL,
    nodeEnv: process.env.NODE_ENV,
  }

  return Response.json(result)
}
