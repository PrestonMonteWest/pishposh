import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('email_verified', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn('email_verification_token_hash', 'text')
    .addColumn('email_verification_expires_at', 'timestamptz')
    .execute()

  await sql`
    CREATE INDEX idx_users_email_verification_token_hash
    ON users (email_verification_token_hash)
    WHERE email_verification_token_hash IS NOT NULL;
  `.execute(db)

  // Grandfather existing users so you don't lock anyone out
  await db.updateTable('users').set('email_verified', true).execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_users_email_verification_token_hash')

  await db.schema
    .alterTable('users')
    .dropColumn('email_verified')
    .dropColumn('email_verification_token_hash')
    .dropColumn('email_verification_expires_at')
}
