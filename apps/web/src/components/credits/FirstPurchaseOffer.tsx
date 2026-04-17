'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

/**
 * First-purchase 50% OFF modal. Rendered inside AppShell; fires once
 * per session when the user has zero purchase transactions AND at least
 * 3 prior logins (so we know they're engaged, not a fresh signup).
 *
 * The backend tells us whether the offer is eligible via GET
 * /api/credits/first-purchase-check. If eligible, the modal renders.
 * On click, we POST to /api/payments/stripe/checkout with the
 * first_purchase coupon and redirect to Stripe's hosted page.
 *
 * The flag `firstPurchaseOffer: true` is written to Transaction.metadata
 * on the webhook handler side so we never re-show the modal for users
 * who already completed a purchase.
 */
export function FirstPurchaseOffer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiClient.get<{ eligible: boolean }>('/api/credits/first-purchase-check');
        if (!cancelled && res.data.eligible) setShow(true);
      } catch {
        // Silent — this is a growth optimization, not critical path.
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<{ url: string }>('/api/payments/stripe/checkout', {
        productKey: 'premium_monthly',
        successUrl: `${window.location.origin}/credits?upgraded=true`,
        cancelUrl: `${window.location.origin}/credits`,
        couponId: 'FIRST50', // Must match a coupon created in Stripe Dashboard.
      });
      window.location.href = res.data.url;
    } catch {
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-md p-6 shadow-2xl text-center"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 text-white/40 hover:text-white/80"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Sparkles size={24} className="text-amber-300" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-1">
              50% OFF your first month
            </h2>
            <p className="text-sm text-purple-200/80 mb-5">
              Unlimited messages, voice notes, and unlocked photos.
              <br />
              <span className="line-through text-purple-300/50">$14.99</span>{' '}
              <span className="text-amber-300 font-bold">$7.49/mo</span>
            </p>

            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
            >
              {loading ? 'Redirecting…' : 'Claim my offer'}
            </button>

            <p className="mt-3 text-[11px] text-purple-300/50">
              Cancel anytime. Billed monthly after trial.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
