'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  MessageSquare,
  ImageIcon,
  Users,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  credits: number;
  isPremium: boolean;
  premiumUntil: string | null;
  createdAt: string;
}

interface CreditsInfo {
  credits: number;
  isPremium: boolean;
  premiumUntil: string | null;
}

export default function ProfilePage() {
  const { user, clear: clearAuth } = useAuthStore();
  const router = useRouter();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await apiClient.get('/users/profile');
      return res.data;
    },
  });

  const { data: creditsInfo } = useQuery<CreditsInfo>({
    queryKey: ['credits'],
    queryFn: async () => {
      const res = await apiClient.get('/users/credits');
      return res.data;
    },
  });

  const handleLogout = async () => {
    // /auth/logout clears the HttpOnly cookies server-side; clearAuth drops
    // the client mirror. Both are needed — one without the other leaves
    // either the server or the store thinking the user is still signed in.
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Non-blocking: even if the call fails, we clear locally.
    }
    clearAuth();
    router.push('/login');
  };

  const credits = creditsInfo?.credits ?? user?.credits ?? 0;
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile?.username ?? user?.username ?? 'User';

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      {profileLoading ? (
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-800 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-40 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-800/60 rounded animate-pulse" />
            <div className="h-4 w-36 bg-gray-800/60 rounded animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5 mb-8">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={displayName}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-semibold text-white truncate">
                {displayName}
              </h2>
              {creditsInfo?.isPremium && (
                <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">
                  PRO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
              <Mail size={14} />
              <span className="truncate">
                {profile?.email ?? user?.email ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
              <Calendar size={14} />
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </div>
      )}

      {/* Credits card */}
      <Link
        href="/credits"
        className="block bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/30 rounded-xl p-5 mb-6 hover:from-purple-900/40 hover:to-indigo-900/40 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-white">
              {credits.toLocaleString()}{' '}
              <span className="text-base font-normal text-gray-400">
                credits
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Chat = 1 · Image = 10 · Voice = 3
            </p>
          </div>
          <div className="flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
            Buy More
            <ChevronRight size={16} />
          </div>
        </div>
      </Link>

      {/* Activity summary */}
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Activity
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <Users size={18} className="text-blue-400 mx-auto mb-1.5" />
          <p className="text-lg font-semibold text-white">—</p>
          <p className="text-xs text-gray-500">Characters</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <MessageSquare size={18} className="text-emerald-400 mx-auto mb-1.5" />
          <p className="text-lg font-semibold text-white">—</p>
          <p className="text-xs text-gray-500">Messages</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <ImageIcon size={18} className="text-amber-400 mx-auto mb-1.5" />
          <p className="text-lg font-semibold text-white">—</p>
          <p className="text-xs text-gray-500">Images</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl divide-y divide-gray-700/50">
        <Link
          href="/credits"
          className="flex items-center justify-between p-4 hover:bg-gray-800/60 transition-colors"
        >
          <div className="flex items-center gap-3 text-gray-300">
            <CreditCard size={18} />
            <span className="text-sm font-medium">Transaction History</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>

        <button
          disabled
          className="flex items-center justify-between p-4 w-full opacity-50 cursor-not-allowed"
        >
          <div className="flex items-center gap-3 text-gray-300">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 w-full text-red-400 hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
