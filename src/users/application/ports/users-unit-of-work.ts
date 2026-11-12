import type { UsersRepository } from './users.repository.js';

export abstract class UsersUnitOfWork {
  abstract execute<T>(
    work: (usersRepository: UsersRepository) => Promise<T>,
  ): Promise<T>;
}
