'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FAQ_ITEMS } from './data/faq';

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative w-full bg-nocturne py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgb(var(--color-plum)/0.45),transparent_55%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-12 px-6">
        <header className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.5em] text-lilac/70">
            Small questions
          </span>
          <h2
            id="faq-heading"
            className="font-display text-[clamp(2.25rem,5vw,4rem)] font-light leading-[1] text-whisper"
          >
            In case you were wondering.
          </h2>
        </header>

        <ul className="flex flex-col divide-y divide-white/10 border-y border-white/10">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <li key={item.q} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-whisper"
                >
                  <span className="font-display text-2xl font-light text-whisper/90 sm:text-3xl">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-whisper/60 transition-transform duration-300 group-hover:border-white/30 ${
                      isOpen ? 'rotate-45 border-lilac/40 text-lilac' : ''
                    }`}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      key="content"
                      id={`faq-answer-${idx}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-14 text-base leading-relaxed text-whisper/70 sm:text-lg">
                        {item.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
