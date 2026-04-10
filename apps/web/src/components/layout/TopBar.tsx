'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/discover': 'Discover',
  '/chat': 'Chats',
  '/gallery': 'Gallery',
  '/profile': 'Profile',
  '/credits': 'Credits',
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

      {/* Right: placeholder for CreditBadge / UserAvatar */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700" />
      </div>
    </header>
  );
}
