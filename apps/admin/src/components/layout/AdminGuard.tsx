'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAdminAuthStore } from '@/store/auth.store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAdminAuthStore();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'forbidden'>(
    'loading',
  );

  useEffect(() => {
    const checkAuth = async () => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_accessToken')
          : null;

      if (!token) {
        setStatus('forbidden');
        return;
      }

      try {
        const res = await apiClient.get('/auth/me');
        const userData = res.data;

        if (userData.role !== 'ADMIN' && userData.role !== 'MODERATOR') {
          setStatus('forbidden');
          return;
        }

        // Update store with fresh data
        login(
          userData,
          token,
          localStorage.getItem('admin_refreshToken') || '',
        );
        setStatus('authorized');
      } catch {
        logout();
        setStatus('forbidden');
      }
    };

    checkAuth();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            You need admin privileges to access this panel. Please log in with
            an authorized account.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
