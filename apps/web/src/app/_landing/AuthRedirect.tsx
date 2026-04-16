'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

/**
 * Client-side redirect for authenticated visitors landing on `/`.
 * Used because auth tokens live in localStorage (see src/store/auth.store.ts)
 * — edge middleware cannot see them. Renders nothing.
 */
export function AuthRedirect() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/discover');
    }
  }, [isAuthenticated, router]);

  return null;
}
