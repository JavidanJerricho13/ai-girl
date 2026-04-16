'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function FinalCTA() {
  const hitRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hit = hitRef.current;
    const btn = btnRef.current;
    const label = labelRef.current;
    if (!hit || !btn || !label) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const quickBtnX = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
    const quickBtnY = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
    const quickLblX = gsap.quickTo(label, 'x', { duration: 0.55, ease: 'power3.out' });
    const quickLblY = gsap.quickTo(label, 'y', { duration: 0.55, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const strength = 0.35;
      quickBtnX(dx * strength);
      quickBtnY(dy * strength);
      quickLblX(dx * strength * 0.4);
      quickLblY(dy * strength * 0.4);
    };

    const onLeave = () => {
      quickBtnX(0);
      quickBtnY(0);
      quickLblX(0);
      quickLblY(0);
    };

    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerleave', onLeave);

    return () => {
      hit.removeEventListener('pointermove', onMove);
      hit.removeEventListener('pointerleave', onLeave);
    };
  }, []);

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
          <Link
            ref={btnRef}
            href="/register"
            className="relative inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-lilac to-rose px-12 py-6 text-lg font-medium text-nocturne transition-[filter] duration-300 hover:brightness-110"
            style={{
              boxShadow:
                '0 30px 80px -15px rgb(var(--color-lilac) / 0.6), inset 0 1px 0 rgb(255 255 255 / 0.3)',
            }}
          >
            <span ref={labelRef} className="relative inline-flex items-center gap-3">
              Begin
              <span aria-hidden>→</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
