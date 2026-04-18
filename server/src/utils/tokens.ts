import { RefreshToken } from '@/models/user/types.js'
import {
  deleteRefreshToken,
  findRefreshToken,
  storeRefreshToken,
} from '@/models/user/user.js'
import { Request } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as createUuid } from 'uuid'

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  'pishposh-access-secret-change-in-production'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface TokenPayload {
  userId: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = createUuid()
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)

  await storeRefreshToken({
    token,
    userId,
    expiresAt,
  })

  return token
}

export async function generateTokens(
  payload: TokenPayload,
): Promise<AuthTokens> {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: await generateRefreshToken(payload.userId),
    tokenType: 'Bearer',
  }
}

/**
 * Attempts to read and verify the token. Returns the payload on success,
 * null on any failure (missing header, malformed, expired, invalid signature).
 * Never throws.
 */
export function tryReadToken(req: Request): TokenPayload | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null

  const token = header.slice('Bearer '.length)
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshToken | null> {
  const storedToken = await findRefreshToken(token)

  if (!storedToken) {
    return null
  }

  if (new Date() > storedToken.expiresAt) {
    await deleteRefreshToken(token)
    return null
  }

  return storedToken
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await deleteRefreshToken(token)
}
