import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})

export class UsersModule {}