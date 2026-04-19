import { TokenPayload, tryReadToken } from '@/utils/tokens.js'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

declare global {
  namespace Express {
    interface Request {
      token?: TokenPayload
    }
  }
}

/**
 * Required auth: 401 if token is missing or invalid.
 */
export const requiredAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const payload = tryReadToken(req)
  if (!payload) {
    res
      .status(401)
      .json({ message: 'Authentication required', code: 'UNAUTHENTICATED' })
    return
  }
  req.token = payload
  next()
}

/**
 * Optional auth: populates req.token if a valid token is present,
 * otherwise lets the request proceed unauthenticated.
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const payload = tryReadToken(req)
  if (payload) {
    req.token = payload
  }
  next()
}
