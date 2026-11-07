import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('login', 'varchar', (col) => col.notNull().unique())
    .addColumn('email', 'varchar', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar', (col) => col.notNull())
    .addColumn('age', 'integer', (col) => col.notNull())
    .addColumn('description', 'varchar(1000)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
