import {
  generateIdentityTokens,
  revokeRefreshToken,
  verifyRefreshToken,
} from '@/lib/identity-tokens.js'
import { hashPassword, verifyPassword } from '@/lib/password.js'
import {
  EMAIL_VERIFICATION_TOKEN_EXPIRY_MS,
  hashToken,
  isExpired,
} from '@/lib/verification-tokens.js'
import { requireAuth } from '@/middleware/auth.js'
import {
  createUser,
  findEmailVerificationByTokenHash,
  findEmailVerificationByUserId,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  issueVerificationEmail,
  setUserEmailAsVerified,
  toPublicUser,
} from '@/models/user/user.js'
import { Router, type Request, type Response } from 'express'
import { verifyCaptchaToken } from '../lib/captcha-tokens.js'

const router = Router()

// POST /oauth/register - Create new user account
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, displayName, password, captchaToken } = req.body

  if (!captchaToken || !(await verifyCaptchaToken(captchaToken))) {
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
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    displayName,
    passwordHash,
  })

  let emailSendFailed: boolean | undefined
  try {
    await issueVerificationEmail(user.id, user.email)
  } catch (err) {
    console.error('Email send failed:', err)
    emailSendFailed = true
  }

  const tokens = await generateIdentityTokens({
    userId: user.id,
    email: user.email,
  })

  return res.status(201).json({
    user: toPublicUser(user),
    emailSendFailed,
    tokens,
  })
})

// POST /oauth/token - Login or refresh token
router.post('/token', async (req: Request, res: Response) => {
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

    const tokens = await generateIdentityTokens({
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
    const tokens = await generateIdentityTokens({
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
})

// POST /oauth/revoke - Revoke refresh token (logout)
router.post('/revoke', requireAuth, async (req: Request, res: Response) => {
  const { refresh_token } = req.body

  if (refresh_token) {
    await revokeRefreshToken(refresh_token)
  }

  return res.json({ message: 'Token revoked' })
})

router.post('/verify-email', async (req, res) => {
  const { token } = req.body ?? {}
  if (typeof token !== 'string' || token.length === 0) {
    return res.status(400).json({
      message: 'Invalid email verification token',
      code: 'INVALID_EMAIL_VERIFICATION_TOKEN',
    })
  }

  const tokenHash = hashToken(token)

  const existing = await findEmailVerificationByTokenHash(tokenHash)
  if (!existing) {
    return res.status(400).json({
      message: 'Invalid email verification token',
      code: 'INVALID_EMAIL_VERIFICATION_TOKEN',
    })
  }
  if (existing.emailVerified) {
    // Idempotent — treat as success so a double-click doesn't confuse users.
    return res.json({ message: 'Email verified', alreadyVerified: true })
  }
  if (isExpired(existing.emailVerificationExpiresAt)) {
    return res.status(400).json({
      message: 'Expired email verification token',
      code: 'EXPIRED_EMAIL_VERIFICATION_TOKEN',
    })
  }

  await setUserEmailAsVerified(existing.userId)

  return res.json({ message: 'Email verified' })
})

router.post('/resend-email-verification', requireAuth, async (req, res) => {
  if (req.user!.emailVerified) {
    return res.status(400).json({ code: 'ALREADY_VERIFIED' })
  }

  const existing = await findEmailVerificationByUserId(req.user!.id)

  if (!existing) {
    return res
      .status(404)
      .json({ message: 'User not found', code: 'USER_NOT_FOUND' })
  }

  // If a token was issued in the last 60 seconds, refuse.
  if (existing.emailVerificationExpiresAt) {
    const issuedAt =
      new Date(existing.emailVerificationExpiresAt).getTime() -
      EMAIL_VERIFICATION_TOKEN_EXPIRY_MS
    if (Date.now() - issuedAt < 60_000) {
      return res.status(429).json({ code: 'RATE_LIMITED' })
    }
  }

  await issueVerificationEmail(req.user!.id, existing.email)
  return res.json({ message: 'Email verification resent' })
})

export default router
