import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  type RefreshToken,
} from '../models/user.js';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'pishposh-access-secret-change-in-production';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'pishposh-refresh-secret-change-in-production';

const ACCESS_TOKEN_EXPIRY = '10s' // '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(userId: string): string {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  storeRefreshToken({
    token,
    userId,
    expiresAt,
  });

  return token;
}

export function generateTokens(payload: TokenPayload): AuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload.userId),
    expiresIn: 900, // 15 minutes in seconds
    tokenType: 'Bearer',
  };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshToken | null {
  const storedToken = findRefreshToken(token);

  if (!storedToken) {
    return null;
  }

  if (new Date() > storedToken.expiresAt) {
    deleteRefreshToken(token);
    return null;
  }

  return storedToken;
}

export function revokeRefreshToken(token: string): void {
  deleteRefreshToken(token);
}
