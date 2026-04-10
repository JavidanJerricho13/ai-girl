'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageSquare, Image, User, X } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/chat', label: 'Chats', icon: MessageSquare },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/profile', label: 'Profile', icon: User },
];

interface SidebarNavProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function SidebarNav({ mobileOpen, onMobileClose }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full bg-gray-950 border-r border-gray-800
          flex flex-col transition-transform duration-200 ease-in-out
          w-60 lg:w-60 md:w-[60px]
          md:relative md:z-auto md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 shrink-0">
          <Link
            href="/discover"
            className="flex items-center gap-2 text-white font-semibold"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
              E
            </span>
            <span className="lg:block md:hidden">Ethereal</span>
          </Link>
          <button
            onClick={onMobileClose}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors relative
                  ${
                    active
                      ? 'bg-purple-900/30 text-purple-400 border-l-2 border-purple-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-2 border-transparent'
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                <span className="lg:block md:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
