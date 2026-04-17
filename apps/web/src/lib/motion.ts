/**
 * Shared Framer Motion animation variants and spring configs.
 * Import these instead of defining inline animations per component.
 */

export const spring = {
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  bouncy: { type: 'spring' as const, stiffness: 500, damping: 20 },
};

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
};

export const fadeBlur = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.3 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const stagger = (delay = 0.05) => ({
  animate: { transition: { staggerChildren: delay } },
});

/**
 * Returns empty variants when the user prefers reduced motion.
 * Use: `<motion.div {...useMotionSafe(fadeUp)}>`
 */
export function useMotionSafe<T extends Record<string, unknown>>(variants: T): T | Record<string, never> {
  // Check at module level — the CSS media query already handles runtime,
  // this just prevents JS-driven animations from firing.
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {} as Record<string, never>;
  }
  return variants;
}
