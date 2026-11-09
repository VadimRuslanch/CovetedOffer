import {
  ConflictException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as argon2 from 'argon2';
import type { Database, JwtPayload, User } from '../types.js';
import { UsersRepository } from '../users/users.repository.js';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto.js';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import jwtConfig from '../config/jwt.config.js';
import { DATABASE } from '../database/database.module.js';
import { Kysely, Transaction } from 'kysely';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtOptions: ConfigType<typeof jwtConfig>,

    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {}

  async register(dto: CreateUserDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    await this.ensureLoginAvailable(dto.login);
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await argon2.hash(dto.password);

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

      const tokens = await this.issueTokens(user.id);
      const refreshHash = await argon2.hash(tokens.refreshToken);

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
    const tokens = await this.issueTokens(user.id);
    await this.hashAndUpdateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.usersRepository.updateRefreshTokenHash(userId, null);
  }

  async refresh(refreshToken: string) {
    let jwt: { sub: number; token: string };

    try {
      jwt = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtOptions.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Недействительный или просроченный refresh-токен',
      );
    }

    if (
      !Number.isSafeInteger(jwt.sub) ||
      jwt.sub <= 0 ||
      jwt.token !== 'refresh_token'
    ) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    return this.db.transaction().execute(async (trx) => {
      const user = await this.usersRepository.findByIdForUpdate(jwt.sub, trx);

      if (!user || !user.refresh_token_hash) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const isValid = await argon2.verify(
        user.refresh_token_hash,
        refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const tokens = await this.issueTokens(user.id);
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

    const isPasswordValid = await argon2.verify(
      user.password_hash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return user;
  }

  private async issueTokens(userID: number): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userID,
          token: 'access_token',
        },
        {
          secret: this.jwtOptions.accessSecret,
          expiresIn: this.jwtOptions.accessTtl,
        },
      ),
      this.jwtService.signAsync(
        { sub: userID, token: 'refresh_token', jti: randomUUID() },
        {
          secret: this.jwtOptions.refreshSecret,
          expiresIn: this.jwtOptions.refreshTtl,
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async hashAndUpdateRefreshToken(
    userId: number,
    refreshToken: string,
    db: Kysely<Database> | Transaction<Database> = this.db,
  ): Promise<void> {
    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.usersRepository.updateRefreshTokenHash(
      userId,
      refreshTokenHash,
      db,
    );
  }
}
