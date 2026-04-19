export interface User {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  createdAt: string
}

export interface RefreshToken {
  token: string
  userId: string
  expiresAt: Date
}
