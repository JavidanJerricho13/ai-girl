'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { CreditBadge } from '@/components/credits/CreditBadge';

const PAGE_TITLES: Record<string, string> = {
  '/discover': 'Discover',
  '/chat': 'Chats',
  '/gallery': 'Gallery',
  '/profile': 'Profile',
  '/credits': 'Credits',
  '/characters': 'Character Detail',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + '/')) return title;
  }

  return 'Ethereal';
}

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const { user } = useAuthStore();

  return (
    <header className="h-16 shrink-0 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-gray-400 hover:text-white p-1.5 -ml-1.5 rounded-lg hover:bg-gray-800/50 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>

      {/* Right: Credit badge + avatar */}
      <div className="flex items-center gap-3">
        <CreditBadge credits={user?.credits ?? 0} />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
          {user?.username?.charAt(0).toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
