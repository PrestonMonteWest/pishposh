import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.js';

let db: Kysely<Database> | null = null;

export function getDb(): Kysely<Database> {
  if (!db) {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://pishposh:pishposh@localhost:5432/pishposh';

    db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new pg.Pool({
          connectionString,
          max: 10,
        }),
      }),
    });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    console.log('Database connection closed');
  }
}
