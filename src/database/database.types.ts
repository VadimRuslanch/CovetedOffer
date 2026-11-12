import type { ColumnType, Generated, Selectable } from 'kysely';

export interface UserTable {
  id: Generated<number>;
  login: string;
  email: string;
  password_hash: string;
  age: number;
  description: string;
  created_at: ColumnType<Date, string | undefined, never>;
  refresh_token_hash: string | null;
  deleted_at: ColumnType<Date | null, string | undefined, string | undefined>;
}

export interface Database {
  users: UserTable;
}

export type UserRow = Selectable<UserTable>;
