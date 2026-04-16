'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

/**
 * Presence — subtle breathing + gaze-follow on a character portrait.
 * Breathing: CSS scale oscillation.
 * Gaze: inner layer translates a few pixels toward the cursor.
 */
export function HeroPortrait() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2))) * 10;
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2))) * 7;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      inner.style.setProperty('--gaze-x', `${currentX.toFixed(2)}px`);
      inner.style.setProperty('--gaze-y', `${currentY.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto aspect-[3/4] w-full max-w-[min(32rem,80vw)]"
      style={{
        filter: 'drop-shadow(0 50px 120px rgb(var(--color-lilac) / 0.35))',
      }}
    >
      <div
        ref={innerRef}
        className="absolute inset-0 motion-safe:animate-[breathing_5.5s_ease-in-out_infinite] overflow-hidden rounded-[2.5rem] border border-white/10"
        style={{
          transform:
            'translate3d(var(--gaze-x, 0), var(--gaze-y, 0), 0) scale(var(--breath, 1))',
          willChange: 'transform',
        }}
      >
        <Image
          src="/landing/hero-portrait.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="(min-width: 768px) 32rem, 80vw"
          quality={90}
          className="object-cover object-[center_25%]"
        />

        {/* Soft edge darkening — keeps the portrait feeling photographic,
            just blends the frame into the atmosphere without tinting skin */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_55%,rgb(var(--color-nocturne)/0.45)_100%)]"
        />
      </div>

      {/* Soft outer glow — living aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-[radial-gradient(circle,rgb(var(--color-lilac)/0.22),transparent_60%)] blur-2xl motion-safe:animate-[breathing_5.5s_ease-in-out_infinite]"
      />

      <style jsx>{`
        @keyframes breathing {
          0%,
          100% {
            --breath: 1;
          }
          50% {
            --breath: 1.015;
          }
        }
      `}</style>
    </div>
  );
}
