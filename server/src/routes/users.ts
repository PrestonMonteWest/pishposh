import { Router, type Request, type Response } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { findUserById, toPublicUser } from '../models/user.js'

const router = Router()

// GET /users/me - Get current user profile
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({
      message: 'Unauthorized',
      code: 'UNAUTHORIZED',
    })
    return
  }

  const user = await findUserById(userId)

  if (!user) {
    res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND',
    })
    return
  }

  res.json(toPublicUser(user))
})

export default router
