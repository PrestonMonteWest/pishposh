import { TokenPayload, tryReadToken } from '@/lib/identity-tokens.js'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { User } from '../models/user/types.js'
import { findUserById } from '../models/user/user.js'

declare global {
  namespace Express {
    interface Request {
      token?: TokenPayload
      user?: User
    }
  }
}

/**
 * Required auth: 401 if token is missing or invalid.
 * Populates req.user if a valid token and user exist.
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const payload = tryReadToken(req)
  if (!payload) {
    return res
      .status(401)
      .json({ message: 'Authentication required', code: 'UNAUTHENTICATED' })
  }
  const user = await findUserById(payload.userId)
  if (!user) {
    return res
      .status(401)
      .json({ message: 'Authentication required', code: 'UNAUTHENTICATED' })
  }
  req.token = payload
  req.user = user
  next()
}

/**
 * Optional auth: populates req.token if a valid token is present,
 * otherwise lets the request proceed unauthenticated.
 * Does not populate req.user.
 */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const payload = tryReadToken(req)
  if (payload) {
    req.token = payload
  }
  next()
}
