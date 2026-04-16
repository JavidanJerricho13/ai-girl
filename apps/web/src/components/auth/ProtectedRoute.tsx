'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Legacy client-side guard. The primary protection is now in
 * apps/web/src/middleware.ts (edge redirect) and apps/web/src/app/(app)/layout.tsx
 * (SSR /auth/me check). This wrapper stays as a belt-and-braces fallback
 * for any page outside the (app) group that still mounts client-only.
 *
 * When the SSR check passes, <AuthHydrator /> seeds the store to
 * 'authenticated' before this runs — so users never see the spinner.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 size={28} className="animate-spin text-purple-500" />
      </div>
    );
  }

  return <>{children}</>;
}
