'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, LogOut } from 'lucide-react';
import { useAdminAuthStore } from '@/store/auth.store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/characters': 'Characters',
  '/users': 'Users',
  '/moderation': 'Moderation',
  '/logs': 'Financial Logs',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }
  return 'Admin Panel';
}

export function TopBar() {
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

      {/* Center: search */}
      <div className="hidden md:block relative max-w-xs w-full mx-8">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search... (Cmd+K)"
          disabled
          className="w-full pl-9 pr-4 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-400 placeholder-gray-600 cursor-not-allowed"
        />
      </div>

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
