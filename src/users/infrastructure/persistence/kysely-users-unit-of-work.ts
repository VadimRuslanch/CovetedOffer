import { Inject, Injectable } from '@nestjs/common';
import { UsersUnitOfWork } from '../../application/ports/users-unit-of-work.js';
import { DATABASE } from '../../../database/database.module.js';
import { Kysely } from 'kysely';
import { UsersRepository } from '../../application/ports/users.repository.js';
import { KyselyUsersRepository } from './kysely-users.repository.js';
import { Database } from '../../../database/database.types.js';

@Injectable()
export class KyselyUsersUnitOfWork extends UsersUnitOfWork {
  constructor(
    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {
    super();
  }

  execute<T>(
    work: (usersRepository: UsersRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction().execute((trx) => {
      const usersRepository = new KyselyUsersRepository(trx);
      return work(usersRepository);
    });
  }
}
