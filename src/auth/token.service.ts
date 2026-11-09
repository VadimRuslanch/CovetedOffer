import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config.js';
import { randomUUID } from 'node:crypto';
import type { JwtPayload } from '../types.js';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtOptions: ConfigType<typeof jwtConfig>,
  ) {}

  async issueTokens(userID: number): Promise<{
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

  async verifyAccessToken(token: string) {
    return this.verifyToken(
      token,
      this.jwtOptions.accessSecret,
      'access_token',
    );
  }

  async verifyRefreshToken(token: string) {
    return this.verifyToken(
      token,
      this.jwtOptions.refreshSecret,
      'refresh_token',
    );
  }

  private async verifyToken(
    token: string,
    secret: string,
    expectedType: JwtPayload['token'],
  ): Promise<JwtPayload> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: secret,
      });
    } catch (error) {
      throw new UnauthorizedException(
        'Недействительный или просроченный токен',
      );
    }

    if (
      !Number.isSafeInteger(payload.sub) ||
      payload.sub <= 0 ||
      payload.token !== expectedType
    ) {
      throw new UnauthorizedException('Недействительный токен');
    }

    return payload;
  }
}
