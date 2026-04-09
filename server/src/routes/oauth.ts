import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword, verifyPassword } from '../utils/password.js'
import {
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../utils/tokens.js'
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  toPublicUser,
} from '../models/user.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// POST /oauth/register - Create new user account
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, displayName, password } = req.body

    // Validation
    if (!email || !username || !displayName || !password) {
      res.status(400).json({
        message: 'Email, username, display name, and password are required',
        code: 'MISSING_FIELDS',
      })
      return
    }

    if (password.length < 8) {
      res.status(400).json({
        message: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD',
      })
      return
    }

    // Check for existing user
    if (await findUserByEmail(email)) {
      res.status(409).json({
        message: 'Email already registered',
        code: 'EMAIL_EXISTS',
      })
      return
    }

    if (await findUserByUsername(username)) {
      res.status(409).json({
        message: 'Username already taken',
        code: 'USERNAME_EXISTS',
      })
      return
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await createUser({
      id: uuidv4(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
      createdAt: new Date().toISOString(),
    })

    // Generate tokens
    const tokens = await generateTokens({ userId: user.id, email: user.email })

    res.status(201).json({
      user: toPublicUser(user),
      tokens,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    })
  }
})

// POST /oauth/token - Login or refresh token
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { grant_type, email, password, refresh_token } = req.body

    if (grant_type === 'password') {
      // Password grant - login
      if (!email || !password) {
        res.status(400).json({
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        })
        return
      }

      const user = await findUserByEmail(email)
      if (!user) {
        res.status(401).json({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
        return
      }

      const validPassword = await verifyPassword(password, user.passwordHash)
      if (!validPassword) {
        res.status(401).json({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
        return
      }

      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
      })

      res.json({
        user: toPublicUser(user),
        tokens,
      })
    } else if (grant_type === 'refresh_token') {
      // Refresh token grant
      if (!refresh_token) {
        res.status(400).json({
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
        })
        return
      }

      const storedToken = await verifyRefreshToken(refresh_token)
      if (!storedToken) {
        res.status(401).json({
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        })
        return
      }

      const user = await findUserById(storedToken.userId)
      if (!user) {
        res.status(401).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        })
        return
      }

      // Revoke old refresh token and generate new tokens
      await revokeRefreshToken(refresh_token)
      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
      })

      res.json({ tokens })
    } else {
      res.status(400).json({
        message: 'Unsupported grant type',
        code: 'UNSUPPORTED_GRANT_TYPE',
      })
    }
  } catch (error) {
    console.error('Token error:', error)
    res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    })
  }
})

// POST /oauth/revoke - Revoke refresh token (logout)
router.post(
  '/revoke',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body

      if (refresh_token) {
        await revokeRefreshToken(refresh_token)
      }

      res.status(200).json({ message: 'Token revoked' })
    } catch (error) {
      console.error('Revoke error:', error)
      res.status(500).json({
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      })
    }
  },
)

export default router
