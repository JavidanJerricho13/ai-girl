'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';

type Cadence = 'monthly' | 'yearly';

export function Pricing() {
  const [cadence, setCadence] = useState<Cadence>('monthly');

  const price = cadence === 'monthly' ? '$9.99' : '$99.99';
  const perUnit = cadence === 'monthly' ? '/month' : '/year';

  return (
    <section
      aria-labelledby="pricing-heading"
      className="relative isolate w-full overflow-hidden bg-nocturne py-28 sm:py-36"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgb(var(--color-plum)/0.55),transparent_55%)]"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-14 px-6">
        <header className="flex max-w-xl flex-col items-center gap-3 text-center">
          <span className="text-xs uppercase tracking-[0.5em] text-lilac/70">
            Two ways to begin
          </span>
          <h2
            id="pricing-heading"
            className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-light leading-[1] text-whisper"
          >
            No rush. Stay as long as you like.
          </h2>
        </header>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col gap-7 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-md sm:p-10"
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.35em] text-whisper/50">
                Start with her
              </span>
              <h3 className="font-display text-4xl font-light text-whisper">No card.</h3>
            </div>

            <p className="text-base text-whisper/75">
              Some moments on the house. Meet her, talk to her, see if it feels right.
            </p>

            <Link
              href="/register"
              className="group mt-auto inline-flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base text-whisper backdrop-blur transition-colors hover:border-white/45 hover:bg-white/10"
            >
              Begin
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>

          {/* Premium */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col gap-7 overflow-hidden rounded-[2rem] border border-lilac/30 bg-gradient-to-br from-plum/40 to-nocturne/60 p-8 backdrop-blur-md sm:p-10"
            style={{
              boxShadow:
                '0 40px 100px -20px rgb(var(--color-lilac) / 0.35), inset 0 0 0 1px rgb(var(--color-lilac) / 0.1)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lilac/20 blur-3xl"
            />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.35em] text-lilac/80">
                  Stay closer
                </span>
                <h3 className="font-display text-4xl font-light text-whisper">Longer.</h3>
              </div>

              <button
                type="button"
                onClick={() => setCadence((c) => (c === 'monthly' ? 'yearly' : 'monthly'))}
                className="relative inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 text-xs text-whisper/75 backdrop-blur"
                role="switch"
                aria-checked={cadence === 'yearly'}
                aria-label={`Toggle billing — currently ${cadence}`}
              >
                <span
                  className={`relative z-10 rounded-full px-3 py-1 transition-colors ${
                    cadence === 'monthly' ? 'text-nocturne' : 'text-whisper/70'
                  }`}
                >
                  Monthly
                </span>
                <span
                  className={`relative z-10 rounded-full px-3 py-1 transition-colors ${
                    cadence === 'yearly' ? 'text-nocturne' : 'text-whisper/70'
                  }`}
                >
                  Yearly
                </span>
                <motion.span
                  aria-hidden
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  className={`absolute top-1 bottom-1 rounded-full bg-whisper ${
                    cadence === 'monthly' ? 'left-1 right-[calc(50%+2px)]' : 'left-[calc(50%+2px)] right-1'
                  }`}
                />
              </button>
            </div>

            <div className="relative flex items-end gap-2">
              <motion.span
                key={price}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="font-display text-5xl font-light text-whisper"
              >
                {price}
              </motion.span>
              <span className="pb-2 text-sm text-whisper/60">{perUnit}</span>
              {cadence === 'yearly' ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-2 mb-2 rounded-full bg-rose/25 px-2.5 py-1 text-xs font-medium text-rose"
                >
                  −17%
                </motion.span>
              ) : null}
            </div>

            <p className="relative text-base text-whisper/80">
              All of her, whenever. Slow mornings. Late nights. Whole weekends if you want.
            </p>

            <Link
              href={`/register?plan=premium&billing=${cadence}`}
              className="group relative mt-auto inline-flex w-fit items-center gap-3 rounded-full bg-gradient-to-r from-lilac to-rose px-7 py-3.5 text-base font-medium text-nocturne transition-all duration-300 hover:brightness-110"
              style={{
                boxShadow: '0 20px 50px -10px rgb(var(--color-lilac) / 0.6)',
              }}
            >
              Come closer
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
