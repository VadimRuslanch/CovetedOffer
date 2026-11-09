import { Inject, Injectable } from '@nestjs/common';
import { Kysely, sql, Transaction } from 'kysely';
import { DATABASE } from '../database/database.module.js';
import { type Database, NewUser, PublicProfile, type User } from '../types.js';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto.js';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {}

  async findByLogin(login: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .executeTakeFirst();
  }

  async findActiveByLogin(login: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findById(userId: number): Promise<User | undefined> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
  }

  async findByIdForUpdate(
    userId: number,
    db: Kysely<Database> | Transaction<Database> = this.db,
  ) {
    return db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .forUpdate()
      .executeTakeFirst();
  }

  async createUser(
    dto: NewUser,
    db: Kysely<Database> | Transaction<Database> = this.db,
  ): Promise<User> {
    return db
      .insertInto('users')
      .values(dto)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
    db: Kysely<Database> | Transaction<Database> = this.db,
  ): Promise<void> {
    await db
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
      .select(['id', 'login', 'email', 'age', 'description'])
      .where('deleted_at', 'is', null)
      .orderBy('id', 'asc')
      .limit(limit)
      .offset(offset);

    if (login) {
      query = query.where('login', 'ilike', `%${login}%`);
    }

    return query.execute();
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.db
      .updateTable('users')
      .set(dto)
      .where('id', '=', userId)
      .where('deleted_at', 'is', null)
      .returning(['id', 'login', 'email', 'age', 'description'])
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
