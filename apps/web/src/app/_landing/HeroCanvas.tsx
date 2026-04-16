'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const FluidBackground = dynamic(() => import('./FluidBackground'), {
  ssr: false,
  loading: () => null,
});

export function HeroCanvas() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer canvas mount until after LCP + any idle window
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 1200 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = setTimeout(() => setReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      {/* Static gradient serves as LCP-safe fallback and poster */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--color-plum))_0%,rgb(var(--color-nocturne))_60%)]"
      />
      {ready ? <FluidBackground /> : null}
    </div>
  );
}
