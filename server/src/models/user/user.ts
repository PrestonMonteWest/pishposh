import { getDb } from '@/db/connection.js'
import { Users } from '@/db/types.js'
import { sendVerificationEmail } from '@/lib/email.js'
import { generateVerificationToken } from '@/lib/verification-tokens.js'
import type { Selectable } from 'kysely'
import {
  CreateUserInput,
  EmailVerification,
  PublicUser,
  RefreshToken,
  User,
} from './types.js'

function dbRowToUser(row: Selectable<Users>): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    passwordHash: row.password_hash,
    createdAt: (row.created_at as Date).toISOString(),
    emailVerified: row.email_verified,
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

export async function findEmailVerificationByTokenHash(
  tokenHash: string,
): Promise<EmailVerification | undefined> {
  const row = await getDb()
    .selectFrom('users')
    .select([
      'id',
      'email',
      'email_verified',
      'email_verification_token_hash',
      'email_verification_expires_at',
    ])
    .where('email_verification_token_hash', '=', tokenHash)
    .executeTakeFirst()
  return row
    ? {
        userId: row.id,
        email: row.email,
        emailVerified: row.email_verified,
        emailVerificationTokenHash:
          row.email_verification_token_hash ?? undefined,
        emailVerificationExpiresAt:
          row.email_verification_expires_at ?? undefined,
      }
    : undefined
}

export async function findEmailVerificationByUserId(
  userId: string,
): Promise<EmailVerification | undefined> {
  const row = await getDb()
    .selectFrom('users')
    .select([
      'id',
      'email',
      'email_verified',
      'email_verification_token_hash',
      'email_verification_expires_at',
    ])
    .where('id', '=', userId)
    .executeTakeFirst()
  return row
    ? {
        userId: row.id,
        email: row.email,
        emailVerified: row.email_verified,
        emailVerificationTokenHash:
          row.email_verification_token_hash ?? undefined,
        emailVerificationExpiresAt:
          row.email_verification_expires_at ?? undefined,
      }
    : undefined
}

export async function setUserEmailAsVerified(userId: string) {
  await getDb()
    .updateTable('users')
    .set({
      email_verified: true,
      email_verification_token_hash: null,
      email_verification_expires_at: null,
    })
    .where('id', '=', userId)
    .execute()
}

export async function createUser(user: CreateUserInput): Promise<User> {
  const row = await getDb()
    .insertInto('users')
    .values({
      email: user.email,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl ?? null,
      password_hash: user.passwordHash,
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

/**
 * Generates a verification token and sends an email to the user.
 *
 * @param userId
 * @param email
 */
export async function issueVerificationEmail(userId: string, email: string) {
  const { rawToken, tokenHash, expiresAt } = generateVerificationToken()

  await getDb()
    .updateTable('users')
    .set({
      email_verification_token_hash: tokenHash,
      email_verification_expires_at: expiresAt,
    })
    .where('id', '=', userId)
    .execute()

  await sendVerificationEmail(email, rawToken)
}
