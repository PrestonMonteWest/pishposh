import { closeDb, getDb } from '@/db/connection.js'
import { promises as fs } from 'fs'
import { FileMigrationProvider, Migrator } from 'kysely'
import path from 'path'

async function migrate() {
  const db = getDb()

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(import.meta.dirname, '../db/migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executed successfully`)
    } else if (result.status === 'Error') {
      console.error(`Migration "${result.migrationName}" failed`)
    }
  })

  if (error) {
    console.error('Migration failed:', error)
    process.exitCode = 1
  }

  await closeDb()
}

migrate()
