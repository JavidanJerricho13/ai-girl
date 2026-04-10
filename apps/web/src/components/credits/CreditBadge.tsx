'use client';

import { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';
import Link from 'next/link';

interface CreditBadgeProps {
  credits: number;
}

export function CreditBadge({ credits }: CreditBadgeProps) {
  const [animate, setAnimate] = useState(false);
  const prevCredits = useRef(credits);

  useEffect(() => {
    if (credits !== prevCredits.current) {
      setAnimate(true);
      prevCredits.current = credits;
      const timer = setTimeout(() => setAnimate(false), 400);
      return () => clearTimeout(timer);
    }
  }, [credits]);

  return (
    <Link
      href="/credits"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all ${
        animate ? 'scale-110' : 'scale-100'
      }`}
      style={{ transition: 'transform 0.3s ease, background-color 0.2s' }}
    >
      <Coins size={14} className="text-purple-400" />
      <span>{credits.toLocaleString()}</span>
    </Link>
  );
}
