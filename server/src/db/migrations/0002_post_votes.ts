import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createType('vote_value').asEnum(['up', 'down']).execute()

  await db.schema
    .createTable('post_votes')
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade'),
    )
    .addColumn('value', sql`vote_value`, (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('post_votes_pkey', ['user_id', 'post_id'])
    .execute()

  await db.schema
    .createIndex('idx_post_votes_post_id')
    .on('post_votes')
    .column('post_id')
    .execute()

  // Auto-update updated_at on row modification
  await sql`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db)

  await sql`
    CREATE TRIGGER post_votes_set_updated_at
    BEFORE UPDATE ON post_votes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS post_votes_set_updated_at ON post_votes;`.execute(
    db,
  )
  await db.schema.dropTable('post_votes').execute()
  await db.schema.dropType('vote_value').execute()
  // Note: set_updated_at() function intentionally left in place — likely reused elsewhere
}
