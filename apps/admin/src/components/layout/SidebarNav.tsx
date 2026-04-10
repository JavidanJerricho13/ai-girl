'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BarChart3,
  Settings,
  ExternalLink,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/characters', label: 'Characters', icon: Users },
      { href: '/users', label: 'Users', icon: UserCog },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/logs', label: 'Financial Logs', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="w-[260px] bg-[#0a0a0a] border-r border-gray-800 flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-gray-800 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white">
            E
          </span>
          <div>
            <span className="text-sm font-semibold text-white">Ethereal</span>
            <span className="text-[10px] text-indigo-400 font-medium ml-1.5 bg-indigo-900/30 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-indigo-900/30 text-indigo-400'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: Live site link */}
      <div className="p-3 border-t border-gray-800">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
        >
          <ExternalLink size={14} />
          View Live Site
        </a>
      </div>
    </aside>
  );
}
