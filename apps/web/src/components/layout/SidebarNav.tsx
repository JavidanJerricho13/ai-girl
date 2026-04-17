'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, MessageSquare, Image, User, X, Settings } from 'lucide-react';

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

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarNavProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function SidebarNav({ mobileOpen, onMobileClose }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onMobileClose}
        title={item.label}
        className={`
          group/item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-200 relative
          ${
            active
              ? 'bg-lilac/10 text-lilac'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {/* Active indicator dot */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-lilac" />
        )}
        <Icon size={20} className="shrink-0" />
        <span className="lg:block md:hidden whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-full
          glass border-r border-white/5
          flex flex-col transition-all duration-200 ease-in-out
          w-60 lg:w-56 md:w-16
          md:relative md:z-auto md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/5 shrink-0">
          <Link
            href="/discover"
            className="flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-lilac to-rose flex items-center justify-center text-sm font-bold text-nocturne shrink-0">
              E
            </span>
            <span className="text-sm font-semibold text-white lg:block md:hidden">
              Ethereal
            </span>
          </Link>
          <button
            onClick={onMobileClose}
            className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map(renderItem)}
        </nav>

        {/* Bottom nav */}
        <div className="py-3 px-2 border-t border-white/5">
          {BOTTOM_ITEMS.map(renderItem)}
        </div>
      </aside>
    </>
  );
}
