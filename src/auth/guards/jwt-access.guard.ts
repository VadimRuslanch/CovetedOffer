import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwtConfig from '../../config/jwt.config.js';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest, JwtPayload } from '../../types.js';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtOptions: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access-токен отсутствует');
    }

    const accessToken: string = authorization.slice(7);

    let jwt: JwtPayload;

    try {
      jwt = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
        secret: this.jwtOptions.accessSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Недействительный или просроченный access-токен',
      );
    }

    if (
      !Number.isSafeInteger(jwt.sub) ||
      jwt.sub <= 0 ||
      jwt.token !== 'access_token'
    ) {
      throw new UnauthorizedException('Недействительный access-токен');
    }

    request.user = jwt;
    return true;
  }
}
