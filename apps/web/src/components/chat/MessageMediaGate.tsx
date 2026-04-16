'use client';

import { useState } from 'react';
import { Lock, Zap, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface MessageMediaGateProps {
  messageId: string;
  previewUrl: string;
  mediaType: 'image' | 'voice';
  // Called with the (now unlocked) URL so the parent bubble can swap in the
  // real <InlineImage /> or <AudioPlayer /> in place of the gate.
  onUnlocked: (payload: { imageUrl?: string; audioUrl?: string }) => void;
}

/**
 * Blurred-preview gate for premium media on free-tier accounts. The
 * backend always sends the real URL (we use it as the blur source so the
 * shape/colour is hinted at) but flags the message with isLocked=true;
 * unlocking costs 1 credit and is persisted per-user in MessageUnlock
 * so reloads don't re-lock already-paid content.
 *
 * We render optimistically: on click we call onUnlocked immediately (so
 * the bubble swaps to the real media right away) and roll back if the
 * server rejects us. If the server succeeds, we also refresh the auth
 * store balance from the response.
 */
export function MessageMediaGate({
  messageId,
  previewUrl,
  mediaType,
  onUnlocked,
}: MessageMediaGateProps) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = mediaType === 'image' ? 'photo' : 'voice note';

  const handleUnlock = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post<{
        unlocked: boolean;
        imageUrl?: string;
        audioUrl?: string;
        balance: number;
      }>(`/api/chat/messages/${messageId}/unlock-media`);

      updateUser({ credits: res.data.balance });
      onUnlocked({
        imageUrl: res.data.imageUrl,
        audioUrl: res.data.audioUrl,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not unlock. Try again?';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleUnlock}
      disabled={loading}
      initial={{ opacity: 0.85 }}
      whileHover={{ opacity: 1 }}
      className="relative block w-64 aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 border border-gray-700/60 text-left disabled:cursor-not-allowed"
    >
      {/* Heavy blur so the real URL leak is irrelevant — you can't actually
          see content through this, only mood/lighting. For voice we skip
          the preview entirely and show a solid gate. */}
      {mediaType === 'image' ? (
        <img
          src={previewUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl brightness-50"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-indigo-900/60" />
      )}

      <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          {loading ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : (
            <Lock size={18} className="text-white" />
          )}
        </div>
        <p className="text-xs text-white/80 uppercase tracking-wider">
          {mediaType === 'image' ? 'Locked photo' : 'Locked voice note'}
        </p>
        <p className="text-[13px] text-white/60 max-w-[200px]">
          She sent you a {label}. Unlock to see it.
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/30 border border-purple-400/50 text-white text-xs font-medium">
          <Zap size={12} />
          Unlock for 1 credit
        </span>
        {error ? (
          <p className="text-[11px] text-red-300 mt-1">{error}</p>
        ) : null}
      </div>
    </motion.button>
  );
}
