import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { FileMigrationProvider, Migrator } from 'kysely/migration';
import { createDatabase } from './create-database.js';

const migrationFolder = fileURLToPath(new URL('./migrations', import.meta.url));

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function migrateToLatest() {
  const db = createDatabase({
    host: getEnv('POSTGRES_HOST'),
    port: Number(getEnv('POSTGRES_PORT')),
    database: getEnv('POSTGRES_DB'),
    user: getEnv('POSTGRES_USER'),
    password: getEnv('POSTGRES_PASSWORD'),
    max: 10,
    statement_timeout: Number(getEnv('POSTGRES_STATEMENT_TIMEOUT_MS')),
  });

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
