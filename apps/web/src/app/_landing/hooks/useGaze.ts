'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Gaze-follow — writes `--gaze-x` / `--gaze-y` CSS vars on `target`,
 * softly lerped toward the cursor offset from `anchor`'s center.
 *
 * Keep `maxPx` small — we want a glance, not a head turn.
 */
export function useGaze<TAnchor extends HTMLElement, TTarget extends HTMLElement>(
  anchorRef: RefObject<TAnchor>,
  targetRef: RefObject<TTarget>,
  opts: { maxX?: number; maxY?: number; ease?: number } = {},
) {
  const { maxX = 10, maxY = 7, ease = 0.08 } = opts;

  useEffect(() => {
    const anchor = anchorRef.current;
    const target = targetRef.current;
    if (!anchor || !target) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      const rect = anchor.getBoundingClientRect();
      const ax = rect.left + rect.width / 2;
      const ay = rect.top + rect.height / 2;
      tx = Math.max(-1, Math.min(1, (e.clientX - ax) / (window.innerWidth / 2))) * maxX;
      ty = Math.max(-1, Math.min(1, (e.clientY - ay) / (window.innerHeight / 2))) * maxY;
    };

    const tick = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      target.style.setProperty('--gaze-x', `${cx.toFixed(2)}px`);
      target.style.setProperty('--gaze-y', `${cy.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [anchorRef, targetRef, maxX, maxY, ease]);
}
