import { Kysely, PostgresDialect } from 'kysely'
import pg from 'pg'
import type { DB } from './types.js'

let db: Kysely<DB> | null = null

export function getDb(): Kysely<DB> {
  if (!db) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://pishposh:pishposh@localhost:5432/pishposh'

    db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: new pg.Pool({
          connectionString,
          max: 20,
        }),
      }),
    })
  }
  return db
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy()
    db = null
    console.log('Database connection closed')
  }
}
