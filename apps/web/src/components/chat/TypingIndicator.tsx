'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  phase?: 'thinking' | 'typing';
}

export function TypingIndicator({ phase = 'thinking' }: TypingIndicatorProps) {
  if (phase === 'thinking') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 glass rounded-2xl rounded-bl-md w-fit">
        <motion.div
          className="w-4 h-4 rounded-full border-2 border-lilac/40 border-t-lilac"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-xs text-gray-500">thinking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-4 py-3 glass rounded-2xl rounded-bl-md w-fit">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-lilac/60 rounded-full"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}
