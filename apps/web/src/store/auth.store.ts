import { create } from 'zustand';

/**
 * Auth state is derived from HttpOnly cookies the API sets on /auth/login,
 * /auth/register and /auth/refresh. The frontend never touches tokens
 * directly — it just mirrors "is this session logged in?" and the user row.
 *
 * Hydration happens in two places:
 *   1. <AuthHydrator /> runs on the client once and calls GET /auth/me.
 *   2. Pages that need the user can also call /auth/me on demand.
 *
 * We intentionally don't persist to localStorage: the source of truth is
 * the server-side session, not the browser.
 */

export interface AuthUser {
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

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  // 'unknown' = haven't hit /auth/me yet; SSR layouts treat this as logged-out
  // for rendering but the client hydrator flips it after the probe resolves.
  status: 'unknown' | 'authenticated' | 'unauthenticated';
  setUser: (user: AuthUser) => void;
  clear: () => void;
  updateUser: (patch: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  status: 'unknown',

  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      status: 'authenticated',
    }),

  clear: () =>
    set({
      user: null,
      isAuthenticated: false,
      status: 'unauthenticated',
    }),

  updateUser: (patch) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...patch } : null,
    })),
}));
