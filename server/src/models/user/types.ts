export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  passwordHash: string
  createdAt: string
  emailVerified: boolean
}

export interface PublicUser {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  createdAt: string
  emailVerified: boolean
}

export interface EmailVerification {
  userId: string
  email: string
  emailVerified: boolean
  emailVerificationTokenHash?: string
  emailVerificationExpiresAt?: Date
}

export interface RefreshToken {
  token: string
  userId: string
  expiresAt: Date
}

// Input shape
export interface CreateUserInput {
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  passwordHash: string
}
