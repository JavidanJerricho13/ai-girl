import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE_NAME = 'auth-token';
export const REFRESH_COOKIE_NAME = 'refresh-token';
export const GUEST_COOKIE_NAME = 'guest-id';

// 15 minutes — matches JWT_EXPIRATION default in auth.service
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
// 7 days — matches refresh-token expiry
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// 7 days for guest sessions
const GUEST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isProd = () => process.env.NODE_ENV === 'production';

const baseCookieOpts = (): CookieOptions => ({
  httpOnly: true,
  // Lax lets the cookie ride top-level navigations (e.g. OAuth redirect) but
  // blocks most CSRF. Upgrade to 'strict' once we have a CSRF token pattern.
  sameSite: 'lax',
  secure: isProd(),
  path: '/',
});

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(AUTH_COOKIE_NAME, tokens.accessToken, {
    ...baseCookieOpts(),
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  // Scope the refresh cookie to /api/auth so it isn't sent on every request.
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseCookieOpts(),
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { ...baseCookieOpts() });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...baseCookieOpts(), path: '/api/auth' });
}

export function setGuestCookie(res: Response, guestId: string): void {
  res.cookie(GUEST_COOKIE_NAME, guestId, {
    ...baseCookieOpts(),
    maxAge: GUEST_MAX_AGE_MS,
  });
}

export function clearGuestCookie(res: Response): void {
  res.clearCookie(GUEST_COOKIE_NAME, { ...baseCookieOpts() });
}
