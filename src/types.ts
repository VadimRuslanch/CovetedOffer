import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
} from 'kysely';

export interface Database {
  users: UserTable;
}

export interface UserTable {
  id: Generated<number>;
  login: string;
  email: string;
  password_hash: string;
  age: number;
  description: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
