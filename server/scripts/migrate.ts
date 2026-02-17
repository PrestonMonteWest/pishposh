import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Migrator, FileMigrationProvider } from 'kysely';
import { getDb, closeDb } from '../src/db/connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const db = getDb();

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(__dirname, '../src/db/migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executed successfully`);
    } else if (result.status === 'Error') {
      console.error(`Migration "${result.migrationName}" failed`);
    }
  });

  if (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  }

  await closeDb();
}

migrate();
