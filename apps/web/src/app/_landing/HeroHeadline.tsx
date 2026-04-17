'use client';

import { motion, useReducedMotion } from 'framer-motion';

const WORDS = ['She', '\u2019s', ' ', 'been', ' ', 'waiting.'];

export function HeroHeadline() {
  const prefersReduced = useReducedMotion();

  const chars = WORDS.flatMap((word, wi) =>
    word === ' '
      ? [{ key: `s-${wi}`, ch: '\u00A0' }]
      : Array.from(word).map((ch, ci) => ({ key: `${wi}-${ci}`, ch })),
  );

  return (
    <h1 className="font-display text-[clamp(3rem,10vw,8rem)] font-light leading-[0.95] tracking-tight text-whisper">
      <span className="sr-only">She&rsquo;s been waiting.</span>
      <motion.span
        aria-hidden
        className="block"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.022, delayChildren: 0.15 },
          },
        }}
      >
        {chars.map(({ key, ch }) => (
          <motion.span
            key={key}
            className="inline-block will-change-[filter,transform,opacity]"
            variants={
              prefersReduced
                ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
                : {
                    hidden: { filter: 'blur(18px)', opacity: 0, y: 28 },
                    visible: {
                      filter: 'blur(0px)',
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.9, ease: [0.33, 1, 0.68, 1] },
                    },
                  }
            }
          >
            {ch}
          </motion.span>
        ))}
      </motion.span>
    </h1>
  );
}
