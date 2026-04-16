'use client';

import { useEffect } from 'react';
import { useAuthStore, type AuthUser } from '@/store/auth.store';

/**
 * Seeds the Zustand auth store with the user the (app) layout fetched on
 * the server, so client components can read auth state synchronously without
 * re-fetching /auth/me on mount.
 */
export function AuthHydrator({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
}
