import { Inject, Injectable } from '@nestjs/common';
import { Kysely, Transaction } from 'kysely';
import { DATABASE } from '../database/database.module.js';
import { type Database, NewUser, type User } from '../types.js';

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
}
