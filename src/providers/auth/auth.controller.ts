import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response, Request } from 'express';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import type { AuthenticatedRequest } from '../../types.js';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import {
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
  setRefreshCookie,
} from './refresh-cookie.helper.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Регистрация',
    description:
      'Создаёт пользователя, возвращает access JWT и устанавливает refresh JWT в HttpOnly-cookie refreshToken.',
  })
  @ApiCreatedResponse({
    description: 'Пользователь зарегистрирован',
    type: AuthResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Новый refresh JWT в HttpOnly-cookie refreshToken',
        schema: {
          type: 'string',
          example: 'refreshToken=<jwt>; Path=/auth; HttpOnly; SameSite=Lax',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Логин или email уже используется',
    type: ErrorResponseDto,
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  @ApiOperation({
    summary: 'Вход',
    description:
      'Возвращает access JWT и устанавливает refresh JWT в HttpOnly-cookie refreshToken.',
  })
  @ApiCreatedResponse({
    description: 'Вход выполнен',
    type: AuthResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Новый refresh JWT в HttpOnly-cookie refreshToken',
        schema: {
          type: 'string',
          example: 'refreshToken=<jwt>; Path=/auth; HttpOnly; SameSite=Lax',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Неверный логин или пароль',
    type: ErrorResponseDto,
  })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    setRefreshCookie(response, refreshToken);
    return { accessToken };
  }

  @ApiOperation({ summary: 'Выход и отзыв refresh-токена' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Refresh-токен отозван, cookie очищена' })
  @ApiUnauthorizedResponse({
    description: 'Access-токен отсутствует, недействителен или истёк',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const userId = request.user.sub;

    await this.authService.logout(userId);

    clearRefreshCookie(response);
  }

  @ApiOperation({
    summary: 'Обновление пары токенов',
    description:
      'Принимает refresh JWT из HttpOnly-cookie, отзывает его и выдаёт новую пару токенов.',
  })
  @ApiCookieAuth('refresh-token')
  @ApiCreatedResponse({
    description: 'Пара токенов обновлена',
    type: AuthResponseDto,
    headers: {
      'Set-Cookie': {
        description: 'Новый refresh JWT в HttpOnly-cookie refreshToken',
        schema: {
          type: 'string',
          example: 'refreshToken=<jwt>; Path=/auth; HttpOnly; SameSite=Lax',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh-токен отсутствует, недействителен, истёк или отозван',
    type: ErrorResponseDto,
  })
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const currentRefreshToken: unknown = request.cookies?.[REFRESH_COOKIE_NAME];

    if (
      typeof currentRefreshToken !== 'string' ||
      currentRefreshToken.length === 0
    ) {
      throw new UnauthorizedException(
        'Refresh-токен отсутствует или недействителен',
      );
    }

    const { accessToken, refreshToken } =
      await this.authService.refresh(currentRefreshToken);

    setRefreshCookie(response, refreshToken);

    return { accessToken };
  }
}
