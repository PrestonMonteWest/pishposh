import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // pgcrypto ships with Postgres and provides gen_random_uuid()
  // Safe to run if already enabled
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db)

  await sql`
    ALTER TABLE posts
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `.execute(db)

  await sql`
    ALTER TABLE users
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `.execute(db)

  await sql`
    ALTER TABLE refresh_tokens
    ALTER COLUMN token SET DEFAULT gen_random_uuid()
  `.execute(db)

  await sql`
    ALTER TABLE media_attachments
    ALTER COLUMN id SET DEFAULT gen_random_uuid()
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`ALTER TABLE posts ALTER COLUMN id DROP DEFAULT`.execute(db)
  await sql`ALTER TABLE users ALTER COLUMN id DROP DEFAULT`.execute(db)
  await sql`ALTER TABLE refresh_tokens ALTER COLUMN id DROP DEFAULT`.execute(db)
  await sql`ALTER TABLE media_attachments ALTER COLUMN id DROP DEFAULT`.execute(
    db,
  )
}
