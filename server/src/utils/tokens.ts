import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import {
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  type RefreshToken,
} from '../models/user.js'

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  'pishposh-access-secret-change-in-production'
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  'pishposh-refresh-secret-change-in-production'

const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface TokenPayload {
  userId: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = uuidv4()
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
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  }
}

export function verifyAccessToken(token: string): TokenPayload | null {
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
