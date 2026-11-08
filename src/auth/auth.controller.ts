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
import { CreateUserDto } from './dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import type { Response, Request } from 'express';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import type { AuthenticatedRequest } from '../types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{
    accessToken: string;
  }> {
    const { accessToken, refreshToken } =
      await this.authService.register(createUserDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
    });
    return { accessToken };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
    });
    return { accessToken };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = request.user.sub;

    await this.authService.logout(userId);

    response.clearCookie('refreshToken', {
      path: '/auth',
    });
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh-токен отсутствует');
    }

    const tokens = await this.authService.refresh(refreshToken);

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
    });

    return { accessToken: tokens.accessToken };
  }
}
