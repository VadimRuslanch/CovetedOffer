import type { User } from '../../domain/user.js';
import type { UserRow } from '../../../database/database.types.js';

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    login: row.login,
    email: row.email,
    passwordHash: row.password_hash,
    age: row.age,
    description: row.description,
    createdAt: row.created_at,
    refreshTokenHash: row.refresh_token_hash,
    deletedAt: row.deleted_at,
  };
}
