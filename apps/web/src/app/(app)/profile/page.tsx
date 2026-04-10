'use client';

import { useAuthStore } from '@/store/auth.store';
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user?.username?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-white truncate">
            {user?.username ?? 'User'}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <Mail size={14} />
            <span className="truncate">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
            <Calendar size={14} />
            <span>Member since —</span>
          </div>
        </div>
      </div>

      {/* Credits card */}
      <Link
        href="/credits"
        className="block bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 mb-6 hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-white">
              {user?.credits ?? 0}{' '}
              <span className="text-base font-normal text-gray-400">
                credits
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Chat = 1 · Image = 10 · Voice = 3
            </p>
          </div>
          <div className="flex items-center gap-1 text-purple-400 text-sm font-medium group-hover:text-purple-300">
            Buy More
            <ChevronRight size={16} />
          </div>
        </div>
      </Link>

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
