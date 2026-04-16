'use client';

import { useState, useCallback } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { DailyRewardBanner } from '@/components/credits/DailyRewardBanner';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      <SidebarNav mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuToggle={handleMenuToggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Fires once per (app) mount; renders only if a reward is granted. */}
      <DailyRewardBanner />
    </div>
  );
}
