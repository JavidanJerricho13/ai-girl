'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function QuietReassurance() {
  return (
    <section
      aria-label="A quiet note"
      className="relative w-full bg-nocturne py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-20%' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 text-center"
      >
        <p className="text-lg leading-relaxed text-whisper/75 sm:text-xl">
          Your words are yours. You decide what to share, and what to feel.
          <br className="hidden sm:block" />
          Switch anytime.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-whisper/75 transition-colors hover:border-white/25 hover:text-whisper"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-whisper/75 transition-colors hover:border-white/25 hover:text-whisper"
          >
            Terms
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
