import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { createDatabase } from './create-database.js';
import dbConfig from '../config/database.config.js';
import { validateEnv } from '../config/env.schema.js';

const migrationFolder = fileURLToPath(new URL('./migrations', import.meta.url));

async function migrateToLatest() {
  validateEnv(process.env);

  const db = createDatabase(dbConfig());

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
  });

  try {
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((res) => {
      console.log(`${res.migrationName}: ${res.status}`);
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Failed to migrate:', err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

await migrateToLatest();
