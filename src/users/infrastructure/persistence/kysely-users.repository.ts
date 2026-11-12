import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module.js';
import { Kysely, sql } from 'kysely';
import { UsersRepository } from '../../application/ports/users.repository.js';
import {
  CreateUserData,
  type UpdateProfileData,
  User,
} from '../../domain/user.js';
import { PublicProfile } from '../../domain/user.js';
import { mapUserRow } from './user.mapper.js';
import { Database } from '../../../database/database.types.js';

@Injectable()
export class KyselyUsersRepository extends UsersRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {
    super();
  }

  async findByLogin(login: string): Promise<User | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .executeTakeFirst();

    return row ? mapUserRow(row) : undefined;
  }

  async findActiveByLogin(login: string): Promise<User | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? mapUserRow(row) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    return row ? mapUserRow(row) : undefined;
  }

  async findById(userId: number): Promise<User | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return row ? mapUserRow(row) : undefined;
  }

  async findByIdForUpdate(userId: number) {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .forUpdate()
      .executeTakeFirst();

    return row ? mapUserRow(row) : undefined;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.db
      .insertInto('users')
      .values({
        login: data.login,
        email: data.email,
        password_hash: data.passwordHash,
        age: data.age,
        description: data.description,
        refresh_token_hash: data.refreshTokenHash,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return mapUserRow(row);
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.db
      .updateTable('users')
      .set({
        refresh_token_hash: refreshTokenHash,
      })
      .where('id', '=', userId)
      .executeTakeFirst();
  }

  async searchProfiles(
    limit: number,
    offset: number,
    login: string,
  ): Promise<PublicProfile[]> {
    let query = this.db
      .selectFrom('users')
      .select(['id', 'login', 'age', 'description'])
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .limit(limit)
      .offset(offset);

    if (login) {
      query = query.where('login', 'ilike', `%${login}%`);
    }

    return query.execute();
  }

  async updateProfile(userId: number, data: UpdateProfileData) {
    return this.db
      .updateTable('users')
      .set(data)
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .returning(['login', 'email', 'age', 'description'])
      .executeTakeFirst();
  }

  async deleteProfile(userId: number): Promise<boolean> {
    const result = await this.db
      .updateTable('users')
      .set({
        deleted_at: sql`now()`,
        refresh_token_hash: null,
      })
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  }
}
