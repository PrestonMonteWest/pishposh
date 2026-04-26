import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add the denormalized columns
  await db.schema
    .alterTable('posts')
    .addColumn('upvotes', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('downvotes', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('score', 'integer', (col) =>
      col
        .generatedAlwaysAs(sql`(upvotes - downvotes)`)
        .stored()
        .notNull(),
    )
    .execute()

  // Backfill from existing votes (idempotent — safe to run on a fresh DB with no votes too)
  await sql`
    UPDATE posts p
    SET
      upvotes = COALESCE(counts.up, 0),
      downvotes = COALESCE(counts.down, 0)
    FROM (
      SELECT
        post_id,
        COUNT(*) FILTER (WHERE value = 'up') AS up,
        COUNT(*) FILTER (WHERE value = 'down') AS down
      FROM post_votes
      GROUP BY post_id
    ) AS counts
    WHERE p.id = counts.post_id;
  `.execute(db)

  // Trigger function: adjusts the counts on posts based on the vote change
  await sql`
    CREATE OR REPLACE FUNCTION sync_post_vote_counts()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.value = 'up' THEN
          UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSIF NEW.value = 'down' THEN
          UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;

      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.value = NEW.value THEN
          RETURN NEW;  -- no vote-value change, nothing to sync
        END IF;
        IF OLD.value = 'up' THEN
          UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSIF OLD.value = 'down' THEN
          UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        IF NEW.value = 'up' THEN
          UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.post_id;
        ELSIF NEW.value = 'down' THEN
          UPDATE posts SET downvotes = downvotes + 1 WHERE id = NEW.post_id;
        END IF;
        RETURN NEW;

      ELSIF TG_OP = 'DELETE' THEN
        IF OLD.value = 'up' THEN
          UPDATE posts SET upvotes = upvotes - 1 WHERE id = OLD.post_id;
        ELSIF OLD.value = 'down' THEN
          UPDATE posts SET downvotes = downvotes - 1 WHERE id = OLD.post_id;
        END IF;
        RETURN OLD;
      END IF;

      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db)

  await sql`
    CREATE TRIGGER post_votes_sync_counts
    AFTER INSERT OR UPDATE OR DELETE ON post_votes
    FOR EACH ROW
    EXECUTE FUNCTION sync_post_vote_counts();
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TRIGGER IF EXISTS post_votes_sync_counts ON post_votes;`.execute(
    db,
  )
  await sql`DROP FUNCTION IF EXISTS sync_post_vote_counts();`.execute(db)

  await db.schema
    .alterTable('posts')
    .dropColumn('upvotes')
    .dropColumn('downvotes')
    .dropColumn('score')
    .execute()
}
