'use client';

import { useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { CommandSearch } from '../common/CommandSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts([
    { key: 'k', meta: true, handler: () => setSearchOpen(true) },
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onSearchClick={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
