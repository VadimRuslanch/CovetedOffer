import { Module } from '@nestjs/common';
import { UsersRepository } from './application/ports/users.repository.js';
import { DatabaseModule } from '../database/database.module.js';
import { KyselyUsersRepository } from './infrastructure/persistence/kysely-users.repository.js';
import { UsersUnitOfWork } from './application/ports/users-unit-of-work.js';
import { KyselyUsersUnitOfWork } from './infrastructure/persistence/kysely-users-unit-of-work.js';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: UsersRepository,
      useClass: KyselyUsersRepository,
    },
    {
      provide: UsersUnitOfWork,
      useClass: KyselyUsersUnitOfWork,
    },
  ],
  exports: [UsersRepository, UsersUnitOfWork],
})
export class UsersModule {}
