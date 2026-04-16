'use client';

import { GuestChat } from '@/components/chat/GuestChat';
import { LANDING_CHARACTERS } from './data/characters';

const ARIA = LANDING_CHARACTERS.find((c) => c.id === 'aria') ?? LANDING_CHARACTERS[0];

/**
 * Landing "Try her" section. All chat mechanics live in the shared
 * <GuestChat /> — this file just provides the framed section chrome
 * (radial glow, breathing animation wrapper, in-view activation) and
 * picks Aria as the default character.
 */
export function TryHer() {
  return (
    <section
      aria-labelledby="tryher-heading"
      className="relative isolate w-full overflow-hidden bg-nocturne py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgb(var(--color-plum)/0.55),transparent_55%)]"
      />
      <GuestChat
        character={{
          id: ARIA.id,
          displayName: ARIA.name,
          portrait: ARIA.portrait,
          accent: ARIA.accent,
        }}
        showPortrait
        heading="She said hi."
        eyebrow="A quiet moment"
      />
    </section>
  );
}
