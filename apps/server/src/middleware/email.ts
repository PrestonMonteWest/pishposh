import type { NextFunction, Request, Response } from 'express'

export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Assumes requireAuth ran first and populated req.user
  if (!req.user) {
    return res
      .status(401)
      .json({ message: 'Authentication required', code: 'UNAUTHENTICATED' })
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      message: 'Please verify your email address to perform this action.',
      code: 'EMAIL_NOT_VERIFIED',
    })
  }

  next()
}
