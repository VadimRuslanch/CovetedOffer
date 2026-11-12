import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('login', 'varchar(30)', (col) => col.notNull().unique())
    .addColumn('email', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar', (col) => col.notNull())
    .addColumn('age', 'integer', (col) => col.notNull())
    .addColumn('description', 'varchar(1000)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('refresh_token_hash', 'varchar')
    .addColumn('deleted_at', 'timestamp')
    .addCheckConstraint('users_age_range_check', sql`age BETWEEN 20 AND 100`)
    .execute();

  await db.schema
    .createIndex('users_email_lower_unique')
    .unique()
    .on('users')
    .column(sql`lower(email)`)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
