import {
  ConflictException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as argon2 from 'argon2';
import { UsersRepository } from '../users/users.repository.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async register(dto: CreateUserDto): Promise<void> {
    await this.ensureLoginAvailable(dto.login);
    await this.ensureEmailAvailable(dto.email);
    const passwordHash = await argon2.hash(dto.password);

    await this.usersRepository.createUser({
      login: dto.login,
      email: dto.email,
      password_hash: passwordHash,
      age: dto.age,
      description: dto.description,
    });
  }

  async login(dto: LoginDto): Promise<void> {
    await this.validateCredentials(dto);
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

  private async validateCredentials(dto: LoginDto) {
    const user = await this.usersRepository.findByLogin(dto.login);
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
  }
}
