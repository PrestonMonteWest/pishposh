import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE posts
      ADD CONSTRAINT title_length CHECK (char_length(title) BETWEEN 1 AND 100),
      ADD CONSTRAINT content_length CHECK (char_length(content) BETWEEN 1 AND 2000)
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE posts
      DROP CONSTRAINT title_length,
      DROP CONSTRAINT content_length
  `.execute(db)
}
