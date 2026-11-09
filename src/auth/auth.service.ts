import {
  ConflictException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import type { Database, User } from '../types.js';
import { UsersRepository } from '../users/users.repository.js';
import { LoginDto } from './dto/login.dto.js';
import { Inject } from '@nestjs/common';
import { DATABASE } from '../database/database.module.js';
import { Kysely, Transaction } from 'kysely';
import { HashService } from './hash.service.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,

    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {}

  async register(dto: CreateUserDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    await this.ensureLoginAvailable(dto.login);
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await this.hashService.hash(dto.password);

    const data = {
      login: dto.login,
      email: dto.email,
      password_hash: passwordHash,
      age: dto.age,
      description: dto.description,
      refresh_token_hash: null,
    };

    return this.db.transaction().execute(async (trx) => {
      const user = await this.usersRepository.createUser(data, trx);

      const tokens = await this.tokenService.issueTokens(user.id);
      const refreshHash = await this.hashService.hash(tokens.refreshToken);

      await this.usersRepository.updateRefreshTokenHash(
        user.id,
        refreshHash,
        trx,
      );

      return tokens;
    });
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.validateCredentials(dto);
    const tokens = await this.tokenService.issueTokens(user.id);
    await this.hashAndUpdateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.usersRepository.updateRefreshTokenHash(userId, null);
  }

  async refresh(refreshToken: string) {
    const jwt = await this.tokenService.verifyRefreshToken(refreshToken);
    return this.db.transaction().execute(async (trx) => {
      const user = await this.usersRepository.findByIdForUpdate(jwt.sub, trx);

      if (!user || !user.refresh_token_hash) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const isValid = await this.hashService.verify(
        user.refresh_token_hash,
        refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const tokens = await this.tokenService.issueTokens(user.id);
      await this.hashAndUpdateRefreshToken(user.id, tokens.refreshToken, trx);

      return tokens;
    });
  }

  private async ensureLoginAvailable(login: string): Promise<void> {
    const user = await this.usersRepository.findByLogin(login);

    if (user)
      throw new ConflictException(
        'Пользователь с таким логином уже существует',
      );
  }

  private async ensureEmailAvailable(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (user)
      throw new ConflictException('Пользователь с таким email уже существует');
  }

  private async validateCredentials(dto: LoginDto): Promise<User> {
    const user = await this.usersRepository.findActiveByLogin(dto.login);

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await this.hashService.verify(
      user.password_hash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return user;
  }

  private async hashAndUpdateRefreshToken(
    userId: number,
    refreshToken: string,
    db: Kysely<Database> | Transaction<Database> = this.db,
  ): Promise<void> {
    const refreshTokenHash = await this.hashService.hash(refreshToken);
    await this.usersRepository.updateRefreshTokenHash(
      userId,
      refreshTokenHash,
      db,
    );
  }
}
