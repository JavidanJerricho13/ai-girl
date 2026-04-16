import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AuthHydrator } from '@/components/auth/AuthHydrator';

// Server component: we read the HttpOnly auth cookie on the server and either
// redirect (no cookie → /login) or call /auth/me to get the user row. This
// eliminates the unauth-content flash the old client-side ProtectedRoute had.
//
// A valid cookie is *necessary but not sufficient* — we still verify with
// /auth/me because the token may be forged, expired, or belong to a deleted
// user. If that check fails we fall through to /login.

interface MeResponse {
  id: string;
  email: string;
  username: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  credits: number;
  isPremium?: boolean;
  language?: string;
  role?: string;
}

async function fetchMe(authCookie: string): Promise<MeResponse | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: {
        // Forward the cookie explicitly — server-side fetch doesn't share
        // the browser's cookie jar.
        Cookie: `auth-token=${authCookie}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as MeResponse;
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth-token')?.value;

  if (!authCookie) {
    redirect('/login');
  }

  const user = await fetchMe(authCookie);
  if (!user) {
    redirect('/login');
  }

  return (
    <AuthHydrator user={user}>
      <AppShell>{children}</AppShell>
    </AuthHydrator>
  );
}
