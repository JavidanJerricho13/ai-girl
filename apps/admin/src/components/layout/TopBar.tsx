'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '@/store/auth.store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/characters': 'Characters',
  '/users': 'Users',
  '/moderation': 'Moderation',
  '/logs': 'Transactions',
  '/packages': 'Credit Packages',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'Admin Panel';
}

interface TopBarProps {
  onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = getPageTitle(pathname);
  const { user, logout } = useAdminAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="h-14 shrink-0 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: breadcrumb title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      {/* Center: search trigger */}
      <button
        onClick={onSearchClick}
        className="hidden md:flex items-center gap-2 max-w-xs w-full mx-8 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-colors"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Right: admin info + logout */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-gray-300">
            {user?.username || user?.email || 'Admin'}
          </p>
          <p className="text-[10px] text-indigo-400">{user?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-semibold">
          {(user?.username || user?.email || 'A').charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800/50 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
