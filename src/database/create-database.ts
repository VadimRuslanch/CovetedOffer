import { Pool, type PoolConfig } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { type Database } from '../types.js';

export function createDatabase(config: PoolConfig): Kysely<Database> {
  const pool = new Pool(config);

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<Database>({
    dialect,
  });
}
