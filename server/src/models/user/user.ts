import { getDb } from '@/db/connection.js'
import { Users } from '@/db/types.js'
import type { Selectable } from 'kysely'
import { PublicUser, RefreshToken, User } from './types.js'

function dbRowToUser(row: Selectable<Users>): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    passwordHash: row.password_hash,
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export async function findUserById(id: string): Promise<User | undefined> {
  const row = await getDb()
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()
  return row ? dbRowToUser(row) : undefined
}

export async function findUserByEmail(
  email: string,
): Promise<User | undefined> {
  const row = await getDb()
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst()
  return row ? dbRowToUser(row) : undefined
}

export async function findUserByUsername(
  username: string,
): Promise<User | undefined> {
  const row = await getDb()
    .selectFrom('users')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst()
  return row ? dbRowToUser(row) : undefined
}

export async function createUser(user: User): Promise<User> {
  const row = await getDb()
    .insertInto('users')
    .values({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl ?? null,
      password_hash: user.passwordHash,
      created_at: user.createdAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
  return dbRowToUser(row)
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...publicUser } = user
  return publicUser
}

export async function storeRefreshToken(token: RefreshToken): Promise<void> {
  await getDb()
    .insertInto('refresh_tokens')
    .values({
      token: token.token,
      user_id: token.userId,
      expires_at: token.expiresAt.toISOString(),
    })
    .execute()
}

export async function findRefreshToken(
  token: string,
): Promise<RefreshToken | undefined> {
  const row = await getDb()
    .selectFrom('refresh_tokens')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst()
  if (!row) return undefined
  return {
    token: row.token,
    userId: row.user_id,
    expiresAt: row.expires_at as Date,
  }
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await getDb()
    .deleteFrom('refresh_tokens')
    .where('token', '=', token)
    .execute()
}

export async function deleteUserRefreshTokens(userId: string): Promise<void> {
  await getDb()
    .deleteFrom('refresh_tokens')
    .where('user_id', '=', userId)
    .execute()
}
