import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../types.js';
import { TokenService } from '../token.service.js';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access-токен отсутствует');
    }

    const accessToken = authorization.slice('Bearer '.length);

    if (!accessToken) {
      throw new UnauthorizedException('Access-токен отсутствует');
    }

    request.user = await this.tokenService.verifyAccessToken(accessToken);

    return true;
  }
}
