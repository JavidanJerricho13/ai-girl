'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  LogOut,
  ChevronRight,
  MessageSquare,
  ImageIcon,
  Users,
  Settings,
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

interface UserStats {
  conversations: number;
  messages: number;
  images: number;
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

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/users/stats');
      return res.data;
    },
  });

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Non-blocking
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

  const statItems = [
    { icon: Users, value: stats?.conversations ?? 0, label: 'Characters', color: 'text-blue-400' },
    { icon: MessageSquare, value: stats?.messages ?? 0, label: 'Messages', color: 'text-emerald-400' },
    { icon: ImageIcon, value: stats?.images ?? 0, label: 'Images', color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-8 py-8">
      {/* Avatar + Name — centered editorial layout */}
      {profileLoading ? (
        <div className="text-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-gray-800 animate-pulse mx-auto" />
          <div className="h-7 w-40 bg-gray-800 rounded mx-auto animate-pulse" />
          <div className="h-4 w-56 bg-gray-800/60 rounded mx-auto animate-pulse" />
        </div>
      ) : (
        <section className="text-center">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={displayName}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 glass-accent"
            />
          ) : (
            <div className="w-24 h-24 rounded-full glass-accent flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
              {initial}
            </div>
          )}
          <h1 className="font-display text-fluid-xl text-white">{displayName}</h1>
          <p className="text-fluid-xs text-gray-500 mt-1">
            <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
            Member since {memberSince}
          </p>
          {creditsInfo?.isPremium && (
            <span className="inline-block mt-2 text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full">
              PRO
              {creditsInfo.premiumUntil && (
                <> — expires {new Date(creditsInfo.premiumUntil).toLocaleDateString()}</>
              )}
            </span>
          )}
        </section>
      )}

      {/* Stats — horizontal scroll of glass cards */}
      <section className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
        {statItems.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="snap-start shrink-0 w-28 glass-card rounded-xl p-4 text-center">
            <Icon size={18} className={`${color} mx-auto mb-1.5`} />
            <p className="text-lg font-semibold text-white">{value.toLocaleString()}</p>
            <p className="text-fluid-xs text-gray-500">{label}</p>
          </div>
        ))}
      </section>

      {/* Credits card */}
      <section className="glass-accent rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-fluid-xs text-gray-400">Credit Balance</p>
            <p className="text-fluid-lg font-semibold text-white">
              {credits.toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-2">credits</span>
            </p>
            <p className="text-fluid-xs text-gray-500 mt-1">
              Chat = 1 · Image = 10 · Voice = 3
            </p>
          </div>
          <Link
            href="/credits"
            className="text-sm text-lilac hover:text-lilac/80 transition-colors font-medium"
          >
            Top Up →
          </Link>
        </div>
      </section>

      {/* Menu — clean glass list */}
      <section className="glass rounded-xl divide-y divide-white/5">
        <Link
          href="/credits"
          className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3 text-gray-300">
            <Clock size={18} />
            <span className="text-sm font-medium">Transaction History</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>

        <Link
          href="/settings"
          className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3 text-gray-300">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-4 w-full text-red-400 hover:bg-red-900/5 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </section>
    </div>
  );
}
