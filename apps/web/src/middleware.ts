import { NextResponse, type NextRequest } from 'next/server';

// Keep the names in sync with apps/api/src/modules/auth/auth.cookies.ts.
const AUTH_COOKIE = 'auth-token';

// Routes that require a valid session cookie — if no cookie, bounce to /login
// with ?next= so we can round-trip them back after signing in.
const PROTECTED_PREFIXES = [
  '/discover',
  '/chat',
  '/characters',
  '/gallery',
  '/credits',
  '/profile',
];

const isProtected = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export function middleware(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  // Authenticated visitor hitting the landing page → send them to the app.
  if (pathname === '/' && token) {
    const url = req.nextUrl.clone();
    url.pathname = '/discover';
    return NextResponse.redirect(url);
  }

  // Unauthenticated visitor hitting a protected app route → /login?next=...
  // NOTE: the cookie is httpOnly but the edge middleware can read it — we
  // can't validate the JWT signature here cheaply, so we treat "cookie
  // present" as "probably authenticated". The (app) server layout does a
  // real /auth/me check, and the API rejects stale/forged tokens anyway.
  if (isProtected(pathname) && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/discover/:path*',
    '/chat/:path*',
    '/characters/:path*',
    '/gallery/:path*',
    '/credits/:path*',
    '/profile/:path*',
  ],
};
