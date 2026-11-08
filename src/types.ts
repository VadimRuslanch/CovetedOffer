import { ColumnType, Generated, Insertable, Selectable } from 'kysely';
import type { Request } from 'express';

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
  refresh_token_hash: string | null;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;

export type JwtPayload = {
  sub: number;
  token: 'access_token' | 'refresh_token';
};

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};
