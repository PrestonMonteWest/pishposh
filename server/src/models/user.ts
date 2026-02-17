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

function saveUsers(users: Map<string, User>): void {
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

function saveRefreshTokens(tokens: Map<string, RefreshToken>): void {
  ensureDataDir();
  writeFileSync(TOKENS_FILE, JSON.stringify([...tokens.entries()], null, 2));
}

export function findUserById(id: string): User | undefined {
  return loadUsers().get(id);
}

export function findUserByEmail(email: string): User | undefined {
  for (const user of loadUsers().values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

export function findUserByUsername(username: string): User | undefined {
  for (const user of loadUsers().values()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return user;
    }
  }
  return undefined;
}

export function createUser(user: User): User {
  const users = loadUsers();
  users.set(user.id, user);
  saveUsers(users);
  return user;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export function storeRefreshToken(token: RefreshToken): void {
  const tokens = loadRefreshTokens();
  tokens.set(token.token, token);
  saveRefreshTokens(tokens);
}

export function findRefreshToken(token: string): RefreshToken | undefined {
  return loadRefreshTokens().get(token);
}

export function deleteRefreshToken(token: string): void {
  const tokens = loadRefreshTokens();
  tokens.delete(token);
  saveRefreshTokens(tokens);
}

export function deleteUserRefreshTokens(userId: string): void {
  const tokens = loadRefreshTokens();
  for (const [token, data] of tokens.entries()) {
    if (data.userId === userId) {
      tokens.delete(token);
    }
  }
  saveRefreshTokens(tokens);
}
