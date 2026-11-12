import {
  ConflictException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto.js';
import type { User } from '../../users/domain/user.js';
import { UsersRepository } from '../../users/application/ports/users.repository.js';
import { LoginDto } from './dto/login.dto.js';
import { HashService } from './hash.service.js';
import { TokenService } from './token.service.js';
import { UsersUnitOfWork } from '../../users/application/ports/users-unit-of-work.js';
import { normalizeEmail } from '../../common/utils/normalize-email.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { TokenPair } from '../../types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly hashService: HashService,
    private readonly tokenService: TokenService,
    private readonly usersUnitOfWork: UsersUnitOfWork,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    await this.ensureLoginAvailable(dto.login);
    const normalizedEmail = normalizeEmail(dto.email);
    await this.ensureEmailAvailable(normalizedEmail);
    const passwordHash = await this.hashService.hash(dto.password);

    const data = {
      login: dto.login,
      email: normalizedEmail,
      age: dto.age,
      description: dto.description,
      passwordHash,
      refreshTokenHash: null,
    };

    return this.usersUnitOfWork.execute(async (usersRepository) => {
      const user = await usersRepository.create(data);

      const tokens = await this.tokenService.issueTokens(user.id);

      const refreshHash = await this.hashService.hash(tokens.refreshToken);

      await usersRepository.updateRefreshTokenHash(user.id, refreshHash);

      return tokens;
    });
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.validateCredentials(dto);
    const tokens = await this.tokenService.issueTokens(user.id);
    await this.hashAndUpdateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersRepository.updateRefreshTokenHash(userId, null);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const jwt = await this.tokenService.verifyRefreshToken(refreshToken);

    return this.usersUnitOfWork.execute(async (usersRepository) => {
      const user = await usersRepository.findByIdForUpdate(jwt.sub);

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const isValid = await this.hashService.verify(
        user.refreshTokenHash,
        refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException('Недействительный refresh-токен');
      }

      const tokens = await this.tokenService.issueTokens(user.id);

      await this.hashAndUpdateRefreshToken(
        user.id,
        tokens.refreshToken,
        usersRepository,
      );

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
      user.passwordHash,
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
    usersRepository: UsersRepository = this.usersRepository,
  ): Promise<void> {
    const refreshTokenHash = await this.hashService.hash(refreshToken);
    await usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }
}
