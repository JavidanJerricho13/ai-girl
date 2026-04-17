'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

/**
 * 18+ age-gate modal. Required before a user can enable NSFW content.
 * Collects DOB + explicit confirmation checkbox, persists to User via
 * PATCH /api/users/verify-age. Renders as a full-screen overlay.
 *
 * The server double-checks: User.dob must be ≥18 years before today
 * AND checkbox must be true. We send both so the server can't be
 * spoofed by a bare API call without the DOB.
 */
interface AgeGateProps {
  onVerified: () => void;
  onCancel: () => void;
}

export function AgeGate({ onVerified, onCancel }: AgeGateProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [dob, setDob] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dob || !confirmed) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.patch('/api/users/verify-age', { dob, confirmed: true });
      updateUser({ isPremium: undefined } as any); // force refresh from /auth/me
      onVerified();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Verification failed. Please check your date of birth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Age Verification</h2>
              <p className="text-xs text-gray-400">Required for adult content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="dob" className="block text-sm text-gray-300 mb-1.5">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0]}
                required
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-gray-400 leading-relaxed">
                I confirm that I am at least 18 years old and I consent to viewing
                adult content where enabled. I understand this cannot be undone.
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!dob || !confirmed || loading}
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-sm text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Verify
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
