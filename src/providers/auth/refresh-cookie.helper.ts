import type { CookieOptions, Response } from 'express';
export const REFRESH_COOKIE_NAME = 'refreshToken';
export const REFRESH_COOKIE_PATH = '/auth';

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: REFRESH_COOKIE_PATH,
};

export function setRefreshCookie(response: Response, token: string): void {
  response.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
  });
}
