import {
  CreateUserData,
  OwnProfile,
  PublicProfile,
  UpdateProfileData,
  User,
} from '../../domain/user.js';

export abstract class UsersRepository {
  abstract findByLogin(login: string): Promise<User | undefined>;

  abstract findActiveByLogin(login: string): Promise<User | undefined>;

  abstract findByEmail(email: string): Promise<User | undefined>;

  abstract findById(userId: number): Promise<User | undefined>;

  abstract findByIdForUpdate(userId: number): Promise<User | undefined>;

  abstract create(data: CreateUserData): Promise<User>;

  abstract updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void>;

  abstract searchProfiles(
    limit: number,
    offset: number,
    login: string,
  ): Promise<PublicProfile[]>;

  abstract updateProfile(
    userId: number,
    data: UpdateProfileData,
  ): Promise<OwnProfile | undefined>;

  abstract deleteProfile(userId: number): Promise<boolean>;
}
