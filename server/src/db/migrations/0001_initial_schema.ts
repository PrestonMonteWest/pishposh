import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS citext`.execute(db);

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('email', sql`citext`, (col) => col.notNull().unique())
    .addColumn('username', sql`citext`, (col) => col.notNull().unique())
    .addColumn('display_name', 'text', (col) => col.notNull())
    .addColumn('avatar_url', 'text')
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('refresh_tokens')
    .addColumn('token', 'uuid', (col) => col.primaryKey())
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_user_id')
    .on('refresh_tokens')
    .column('user_id')
    .execute();

  await db.schema
    .createTable('posts')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('creator_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('creator_username', 'text', (col) => col.notNull())
    .addColumn('creator_display_name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_posts_creator_id')
    .on('posts')
    .column('creator_id')
    .execute();

  await sql`
    CREATE INDEX idx_posts_created_at_not_deleted
    ON posts (created_at DESC)
    WHERE deleted_at IS NULL
  `.execute(db);

  await db.schema
    .createTable('media_attachments')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade')
    )
    .addColumn('uri', 'text', (col) => col.notNull())
    .addColumn('mime_type', 'text', (col) => col.notNull())
    .addColumn('filename', 'text', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex('idx_media_attachments_post_id')
    .on('media_attachments')
    .columns(['post_id', 'display_order'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('media_attachments').ifExists().execute();
  await db.schema.dropTable('posts').ifExists().execute();
  await db.schema.dropTable('refresh_tokens').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
