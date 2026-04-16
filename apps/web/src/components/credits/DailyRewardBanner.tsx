'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

/**
 * Auto-claims the daily reward on (app) mount. The backend endpoint is
 * idempotent (returns granted=false if already claimed today), so calling
 * it eagerly is safe. We only render UI when a reward was actually granted —
 * no sign of the feature on subsequent visits the same day.
 *
 * We also fire-and-forget the profile-bonus claim here, since it's the
 * same "scan and grant" pattern and there's no other single place users
 * reliably land after signup.
 */
export function DailyRewardBanner() {
  const updateUser = useAuthStore((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reward, setReward] = useState<{ amount: number; newBalance: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.post<{
          granted: boolean;
          amount: number;
          newBalance: number;
        }>('/api/credits/claim-daily');
        if (!cancelled && res.data.granted) {
          updateUser({ credits: res.data.newBalance });
          setReward({ amount: res.data.amount, newBalance: res.data.newBalance });
        }
      } catch {
        // Silent — daily reward is a nice-to-have; don't surface infra errors.
      }

      try {
        const res = await apiClient.post<{
          granted: string[];
          totalAmount: number;
          newBalance: number;
        }>('/api/credits/claim-profile-bonuses');
        if (!cancelled && res.data.granted?.length) {
          updateUser({ credits: res.data.newBalance });
          // If we already banner'd the daily reward we fold this into the
          // same banner rather than stacking two toasts — the user just
          // sees the bigger "welcome back" moment.
          setReward((prev) => ({
            amount: (prev?.amount ?? 0) + res.data.totalAmount,
            newBalance: res.data.newBalance,
          }));
        }
      } catch {
        // Silent as above.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, updateUser]);

  return (
    <AnimatePresence>
      {reward ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-md border border-purple-500/40 shadow-2xl p-4 text-sm"
          role="status"
        >
          <button
            onClick={() => setReward(null)}
            className="absolute top-2 right-2 text-white/50 hover:text-white/90 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles size={16} className="text-purple-300" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">+{reward.amount} credits</p>
              <p className="mt-0.5 text-xs text-purple-200/80">
                Welcome back — enjoy the top-up. Balance: {reward.newBalance}.
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
