'use client';

import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface LowCreditsBannerProps {
  credits: number;
}

/**
 * Subtle inline banner that surfaces above the message list when the user
 * is running low (or out). Intentionally not a modal — we never interrupt
 * the active conversation; we nudge quietly with a link to the shop.
 *
 * The backend still accepts credits=0 messages (the chat.service throws
 * BadRequestException on deduction), so copy says "will need more" not
 * "you're locked out" to preserve agency.
 */
export function LowCreditsBanner({ credits }: LowCreditsBannerProps) {
  const out = credits <= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="status"
      className={`shrink-0 border-b flex items-center justify-between gap-3 px-4 py-2 text-xs ${
        out
          ? 'bg-red-950/40 border-red-900/60 text-red-200'
          : 'bg-amber-950/30 border-amber-900/40 text-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Zap size={14} className={out ? 'text-red-400' : 'text-amber-400'} />
        <span className="truncate">
          {out
            ? "You're out of credits. Top up to keep the conversation going."
            : `Running low — ${credits} credit${credits === 1 ? '' : 's'} left.`}
        </span>
      </div>
      <Link
        href="/credits"
        className={`inline-flex items-center gap-1 font-medium whitespace-nowrap hover:underline ${
          out ? 'text-red-100' : 'text-amber-100'
        }`}
      >
        Get more
        <ArrowRight size={12} />
      </Link>
    </motion.div>
  );
}
