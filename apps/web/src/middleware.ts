import { NextResponse, type NextRequest } from 'next/server';

/**
 * Scaffolded for future cookie-based auth. Current auth lives in
 * localStorage (see src/store/auth.store.ts), which edge middleware
 * cannot read — so the landing page relies on a client-side redirect
 * in <AuthRedirect /> for authenticated users.
 *
 * Once auth tokens move to httpOnly cookies, uncomment the redirect
 * block below and remove the client-side AuthRedirect component.
 */
export function middleware(_req: NextRequest) {
  // const token = req.cookies.get('auth-token')?.value;
  // if (req.nextUrl.pathname === '/' && token) {
  //   return NextResponse.redirect(new URL('/discover', req.url));
  // }
  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
