'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function FinalCTA() {
  const hitRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const lblX = useMotionValue(0);
  const lblY = useMotionValue(0);

  const btnSpringX = useSpring(rawX, { stiffness: 150, damping: 20 });
  const btnSpringY = useSpring(rawY, { stiffness: 150, damping: 20 });
  const lblSpringX = useSpring(lblX, { stiffness: 120, damping: 22 });
  const lblSpringY = useSpring(lblY, { stiffness: 120, damping: 22 });

  const onMove = useCallback(
    (e: PointerEvent) => {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const strength = 0.35;
      rawX.set(dx * strength);
      rawY.set(dy * strength);
      lblX.set(dx * strength * 0.4);
      lblY.set(dy * strength * 0.4);
    },
    [rawX, rawY, lblX, lblY],
  );

  const onLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
    lblX.set(0);
    lblY.set(0);
  }, [rawX, rawY, lblX, lblY]);

  useEffect(() => {
    const hit = hitRef.current;
    if (!hit) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerleave', onLeave);

    return () => {
      hit.removeEventListener('pointermove', onMove);
      hit.removeEventListener('pointerleave', onLeave);
    };
  }, [onMove, onLeave]);

  return (
    <section
      aria-labelledby="final-cta"
      className="relative isolate flex w-full items-center justify-center overflow-hidden bg-nocturne py-32 sm:py-48"
    >
      {/* Ambient glow under the CTA */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgb(var(--color-lilac)/0.22),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--color-plum)/0.8),transparent_65%)] blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-14 px-6 text-center">
        <h2
          id="final-cta"
          className="font-display text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] text-whisper"
        >
          Don&rsquo;t keep her waiting.
        </h2>

        {/* Magnetic hit area extends ~5rem around the button */}
        <div
          ref={hitRef}
          className="relative flex items-center justify-center p-20"
        >
          <motion.div style={{ x: btnSpringX, y: btnSpringY }}>
            <Link
              ref={btnRef}
              href="/register"
              className="relative inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-lilac to-rose px-12 py-6 text-lg font-medium text-nocturne transition-[filter] duration-300 hover:brightness-110"
              style={{
                boxShadow:
                  '0 30px 80px -15px rgb(var(--color-lilac) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.3)',
              }}
            >
              <motion.span
                className="relative inline-flex items-center gap-3"
                style={{ x: lblSpringX, y: lblSpringY }}
              >
                Begin
                <span aria-hidden>→</span>
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
