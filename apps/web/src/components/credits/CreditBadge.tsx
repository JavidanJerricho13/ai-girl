'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import Link from 'next/link';

interface CreditBadgeProps {
  credits: number;
}

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) =>
    Math.round(v).toLocaleString(),
  );
  const [text, setText] = useState(value.toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(v));
    return unsub;
  }, [display]);

  return <span>{text}</span>;
}

export function CreditBadge({ credits }: CreditBadgeProps) {
  const prevCredits = useRef(credits);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (credits !== prevCredits.current) {
      setFlash(credits > prevCredits.current ? 'up' : 'down');
      prevCredits.current = credits;
      const timer = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timer);
    }
  }, [credits]);

  return (
    <Link href="/credits" className="relative group" title="Your Credits">
      <motion.div
        animate={
          flash
            ? { scale: [1, 1.15, 0.95, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
          bg-gray-800/80 border hover:bg-gray-700 hover:text-white
          ${
            flash === 'up'
              ? 'border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
              : flash === 'down'
                ? 'border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.25)]'
                : 'border-gray-700 hover:border-gray-600'
          }
        `}
      >
        <motion.div
          animate={flash ? { rotate: [0, -15, 15, -10, 0] } : { rotate: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Coins size={14} className="text-purple-400" />
        </motion.div>

        <span className="text-gray-300 group-hover:text-white hidden sm:inline">
          <AnimatedCounter value={credits} />
        </span>
        <span className="text-gray-300 group-hover:text-white sm:hidden">
          {credits.toLocaleString()}
        </span>
      </motion.div>

      {/* Delta indicator */}
      <AnimatePresence>
        {flash && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -16 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute -top-1 right-0 text-xs font-bold pointer-events-none ${
              flash === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {flash === 'up' ? '+' : '−'}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
