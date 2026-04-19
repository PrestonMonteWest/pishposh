import { requiredAuth } from '@/middleware/auth.js'
import { findUserById, toPublicUser } from '@/models/user/user.js'
import { Router, type Request, type Response } from 'express'

const router = Router()

// GET /users/me - Get current user profile
router.get('/me', requiredAuth, async (req: Request, res: Response) => {
  const user = await findUserById(req.token!.userId)

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND',
    })
  }

  return res.json(toPublicUser(user))
})

export default router
