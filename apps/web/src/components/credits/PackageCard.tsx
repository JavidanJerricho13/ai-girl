import { Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PackageCardProps {
  credits: number;
  price: string;
  priceId: string;
  label: string;
  highlight?: boolean;
}

export function PackageCard({
  credits,
  price,
  priceId,
  label,
  highlight = false,
}: PackageCardProps) {
  const handlePurchase = async () => {
    try {
      const { data } = await apiClient.post('/payments/stripe/checkout', {
        priceId,
        successUrl: `${window.location.origin}/credits?purchased=true`,
        cancelUrl: `${window.location.origin}/credits`,
      });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Failed to start checkout:', err);
    }
  };

  return (
    <div
      className={`rounded-xl p-5 text-center border transition-colors ${
        highlight
          ? 'bg-purple-900/30 border-purple-600/50 ring-1 ring-purple-500/20'
          : 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600'
      }`}
    >
      {highlight && (
        <div className="flex items-center justify-center gap-1 mb-2">
          <Sparkles size={12} className="text-purple-300" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
            {label}
          </span>
        </div>
      )}
      {!highlight && (
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-2 block">
          {label}
        </span>
      )}
      <p className="text-2xl font-bold text-white">
        {credits.toLocaleString()}
      </p>
      <p className="text-sm text-gray-400 mb-4">credits</p>
      <button
        onClick={handlePurchase}
        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
          highlight
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        }`}
      >
        {price}
      </button>
    </div>
  );
}
