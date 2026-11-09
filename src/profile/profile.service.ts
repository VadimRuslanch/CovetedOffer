import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: number) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const {
      password_hash,
      refresh_token_hash,
      created_at,
      deleted_at,
      ...profile
    } = user;

    return profile;
  }

  async getProfiles(limit: number, offset: number, login: string = '') {
    return this.usersRepository.searchProfiles(limit, offset, login);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const profile = await this.usersRepository.updateProfile(userId, dto);

    if (!profile) {
      throw new NotFoundException('Пользователь не найден');
    }

    return profile;
  }

  async deleteProfile(userId: number): Promise<void> {
    const isDeleted = await this.usersRepository.deleteProfile(userId);

    if (!isDeleted) {
      throw new NotFoundException('Пользователь не найден');
    }
  }
}
