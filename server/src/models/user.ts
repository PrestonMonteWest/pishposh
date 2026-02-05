export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

// In-memory storage (replace with database in production)
const users = new Map<string, User>();
const refreshTokens = new Map<string, RefreshToken>();

export function findUserById(id: string): User | undefined {
  return users.get(id);
}

export function findUserByEmail(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

export function findUserByUsername(username: string): User | undefined {
  for (const user of users.values()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

export function createUser(user: User): User {
  users.set(user.id, user);
  return user;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function storeRefreshToken(token: RefreshToken): void {
  refreshTokens.set(token.token, token);
}

export function findRefreshToken(token: string): RefreshToken | undefined {
  return refreshTokens.get(token);
}

export function deleteRefreshToken(token: string): void {
  refreshTokens.delete(token);
}

export function deleteUserRefreshTokens(userId: string): void {
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      refreshTokens.delete(token);
    }
  }
}
