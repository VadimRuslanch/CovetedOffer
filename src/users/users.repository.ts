import { Inject, Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
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

  async createUser(dto: NewUser): Promise<User> {
    return this.db
      .insertInto('users')
      .values(dto)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
