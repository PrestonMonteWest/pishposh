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

// JSON file-backed storage (replace with database in production)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../data');
const USERS_FILE = resolve(DATA_DIR, 'users.json');
const TOKENS_FILE = resolve(DATA_DIR, 'refresh-tokens.json');

interface StoredRefreshToken {
  token: string;
  userId: string;
  expiresAt: string;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadUsers(): Map<string, User> {
  if (!existsSync(USERS_FILE)) return new Map();
  try {
    const data = JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as [string, User][];
    return new Map(data);
  } catch {
    return new Map();
  }
}

function saveUsers(): void {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify([...users.entries()], null, 2));
}

function loadRefreshTokens(): Map<string, RefreshToken> {
  if (!existsSync(TOKENS_FILE)) return new Map();
  try {
    const data = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8')) as [string, StoredRefreshToken][];
    return new Map(
      data.map(([key, val]) => [key, { ...val, expiresAt: new Date(val.expiresAt) }])
    );
  } catch {
    return new Map();
  }
}

function saveRefreshTokens(): void {
  ensureDataDir();
  writeFileSync(TOKENS_FILE, JSON.stringify([...refreshTokens.entries()], null, 2));
}

const users = loadUsers();
const refreshTokens = loadRefreshTokens();

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
  saveUsers();
  return user;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function storeRefreshToken(token: RefreshToken): void {
  refreshTokens.set(token.token, token);
  saveRefreshTokens();
}

export function findRefreshToken(token: string): RefreshToken | undefined {
  return refreshTokens.get(token);
}

export function deleteRefreshToken(token: string): void {
  refreshTokens.delete(token);
  saveRefreshTokens();
}

export function deleteUserRefreshTokens(userId: string): void {
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      refreshTokens.delete(token);
    }
  }
  saveRefreshTokens();
}
