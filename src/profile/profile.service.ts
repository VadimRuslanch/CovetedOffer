import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class ProfileService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: number) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const { password_hash, refresh_token_hash, created_at, ...profile } = user;

    return profile;
  }
}
