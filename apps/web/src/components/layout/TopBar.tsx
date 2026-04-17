'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { CreditBadge } from '@/components/credits/CreditBadge';

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U';

  return (
    <header className="h-14 shrink-0 glass border-b border-white/5 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left: hamburger (mobile only) */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden text-gray-400 hover:text-white p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {/* Logo — visible on md when sidebar is icon-only */}
        <Link
          href="/discover"
          className="hidden md:flex lg:hidden items-center gap-2"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-lilac to-rose flex items-center justify-center text-xs font-bold text-nocturne shrink-0">
            E
          </span>
        </Link>
      </div>

      {/* Right: Credit badge + avatar */}
      <div className="flex items-center gap-3">
        <CreditBadge credits={user?.credits ?? 0} />
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-lilac/80 to-rose/80 flex items-center justify-center text-nocturne text-xs font-bold hover:brightness-110 transition-[filter]"
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
