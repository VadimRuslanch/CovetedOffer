import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from '../../users/application/ports/users.repository.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { normalizeEmail } from '../../common/utils/normalize-email.js';
import { OwnProfile, PublicProfile } from '../../users/domain/user.js';

@Injectable()
export class ProfileService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: number): Promise<OwnProfile> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const { login, email, age, description } = user;

    return {
      login,
      email,
      age,
      description,
    };
  }

  async getProfiles(
    page: number,
    limit: number,
    login: string = '',
  ): Promise<PublicProfile[]> {
    const offset = (page - 1) * limit;
    return this.usersRepository.searchProfiles(limit, offset, login);
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<OwnProfile> {
    const hasFieldsToUpdate = Object.values(dto).some(
      (value) => value !== undefined,
    );

    let updateData = dto;

    if (dto.email !== undefined) {
      const normalizedEmail = normalizeEmail(dto.email);
      const existingUser =
        await this.usersRepository.findByEmail(normalizedEmail);

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      updateData = {
        ...dto,
        email: normalizedEmail,
      };
    }

    if (!hasFieldsToUpdate) {
      throw new BadRequestException('Необходимо указать хотя бы одно');
    }

    const profile = await this.usersRepository.updateProfile(
      userId,
      updateData,
    );

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
