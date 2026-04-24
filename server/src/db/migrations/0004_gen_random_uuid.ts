import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // pgcrypto ships with Postgres and provides gen_random_uuid()
  // Safe to run if already enabled
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db)

  await db.schema
    .alterTable('posts')
    .alterColumn('id', (col) => col.setDefault(sql`gen_random_uuid()`))
    .execute()

  await db.schema
    .alterTable('users')
    .alterColumn('id', (col) => col.setDefault(sql`gen_random_uuid()`))
    .execute()

  await db.schema
    .alterTable('refresh_tokens')
    .alterColumn('id', (col) => col.setDefault(sql`gen_random_uuid()`))
    .execute()

  await db.schema
    .alterTable('media_attachments')
    .alterColumn('id', (col) => col.setDefault(sql`gen_random_uuid()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('posts')
    .alterColumn('id', (col) => col.dropDefault())
    .execute()

  await db.schema
    .alterTable('users')
    .alterColumn('id', (col) => col.dropDefault())
    .execute()

  await db.schema
    .alterTable('refresh_tokens')
    .alterColumn('id', (col) => col.dropDefault())
    .execute()

  await db.schema
    .alterTable('media_attachments')
    .alterColumn('id', (col) => col.dropDefault())
    .execute()
}
