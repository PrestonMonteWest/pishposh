import { requiredAuth } from '@/middleware/auth.js'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  toPublicUser,
} from '@/models/user/user.js'
import { hashPassword, verifyPassword } from '@/utils/password.js'
import {
  generateTokens,
  revokeRefreshToken,
  verifyRefreshToken,
} from '@/utils/tokens.js'
import { Router, type Request, type Response } from 'express'
import { v4 as createUuid } from 'uuid'

async function verifyCaptcha(token: string): Promise<boolean> {
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    },
  )

  const data = await res.json()
  return data.success
}

const router = Router()

// POST /oauth/register - Create new user account
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, username, displayName, password, captchaToken } = req.body

    if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
      return res.status(400).json({
        message: 'Unable to verify your request. Please try again.',
        code: 'VERIFICATION_FAILED',
      })
    }

    // Validation
    if (!email || !username || !displayName || !password) {
      return res.status(400).json({
        message: 'Email, username, display name, and password are required',
        code: 'MISSING_FIELDS',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD',
      })
    }

    // Check for existing user
    if (await findUserByEmail(email)) {
      return res.status(409).json({
        message: 'Email already registered',
        code: 'EMAIL_EXISTS',
      })
    }

    if (await findUserByUsername(username)) {
      return res.status(409).json({
        message: 'Username already taken',
        code: 'USERNAME_EXISTS',
      })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await createUser({
      id: createUuid(),
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
      createdAt: new Date().toISOString(),
    })

    // Generate tokens
    const tokens = await generateTokens({ userId: user.id, email: user.email })

    return res.status(201).json({
      user: toPublicUser(user),
      tokens,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({
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
        return res.status(400).json({
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        })
      }

      const user = await findUserByEmail(email)
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
      }

      const validPassword = await verifyPassword(password, user.passwordHash)
      if (!validPassword) {
        return res.status(401).json({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        })
      }

      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
      })

      return res.json({
        user: toPublicUser(user),
        tokens,
      })
    } else if (grant_type === 'refresh_token') {
      // Refresh token grant
      if (!refresh_token) {
        return res.status(400).json({
          message: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN',
        })
      }

      const storedToken = await verifyRefreshToken(refresh_token)
      if (!storedToken) {
        return res.status(401).json({
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN',
        })
      }

      const user = await findUserById(storedToken.userId)
      if (!user) {
        return res.status(401).json({
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        })
      }

      // Revoke old refresh token and generate new tokens
      await revokeRefreshToken(refresh_token)
      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
      })

      return res.json({ tokens })
    } else {
      return res.status(400).json({
        message: 'Unsupported grant type',
        code: 'UNSUPPORTED_GRANT_TYPE',
      })
    }
  } catch (error) {
    console.error('Token error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    })
  }
})

// POST /oauth/revoke - Revoke refresh token (logout)
router.post('/revoke', requiredAuth, async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body

    if (refresh_token) {
      await revokeRefreshToken(refresh_token)
    }

    return res.status(200).json({ message: 'Token revoked' })
  } catch (error) {
    console.error('Revoke error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      code: 'SERVER_ERROR',
    })
  }
})

export default router
