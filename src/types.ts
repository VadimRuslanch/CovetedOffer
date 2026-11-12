import type { Request } from 'express';

export type JwtPayload = {
  sub: number;
  token: 'access_token' | 'refresh_token';
};

export type AuthenticatedRequest = Request & {
  user: JwtPayload;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
