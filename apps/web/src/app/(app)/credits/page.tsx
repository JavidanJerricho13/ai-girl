'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  MessageSquare,
  ImageIcon,
  Mic,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import {
  TransactionList,
  Transaction,
} from '@/components/credits/TransactionList';
import { PackageCard } from '@/components/credits/PackageCard';

interface CreditsInfo {
  credits: number;
  isPremium: boolean;
  premiumUntil: string | null;
}

const PACKAGES = [
  { credits: 500, price: '$4.99', label: 'Starter' },
  { credits: 1200, price: '$9.99', label: 'Most Popular', highlight: true },
  { credits: 2500, price: '$19.99', label: 'Best Value' },
];

export default function CreditsPage() {
  const { user } = useAuthStore();

  const { data: creditsInfo, isLoading: creditsLoading } =
    useQuery<CreditsInfo>({
      queryKey: ['credits'],
      queryFn: async () => {
        const res = await apiClient.get('/users/credits');
        return res.data;
      },
    });

  const {
    data: transactions,
    isLoading: txLoading,
    isError: txError,
    refetch: txRefetch,
  } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/users/transactions', {
        params: { limit: 20 },
      });
      return res.data;
    },
  });

  const credits = creditsInfo?.credits ?? user?.credits ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Wallet className="text-purple-400" size={28} />
        <h2 className="text-2xl font-semibold text-white">
          Credits &amp; Billing
        </h2>
      </div>

      {/* Balance card */}
      {creditsLoading ? (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-xl p-6 mb-8">
          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-10 w-40 bg-gray-700 rounded animate-pulse" />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-xl p-6 mb-8">
          <p className="text-sm text-gray-300 mb-1">Current Balance</p>
          <p className="text-4xl font-bold text-white">
            {credits.toLocaleString()}{' '}
            <span className="text-lg font-normal text-gray-400">credits</span>
          </p>
          {creditsInfo?.isPremium && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded">
              ★ Premium Active
            </div>
          )}
        </div>
      )}

      {/* Cost breakdown */}
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Credit Costs
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <MessageSquare size={20} className="text-blue-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">1</p>
          <p className="text-xs text-gray-500">per message</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <ImageIcon size={20} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">10</p>
          <p className="text-xs text-gray-500">per image</p>
        </div>
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-center">
          <Mic size={20} className="text-amber-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">3</p>
          <p className="text-xs text-gray-500">per voice</p>
        </div>
      </div>

      {/* Packages */}
      <h3
        id="packages"
        className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3"
      >
        Credit Packages
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.credits}
            credits={pkg.credits}
            price={pkg.price}
            label={pkg.label}
            highlight={pkg.highlight}
          />
        ))}
      </div>

      {/* Transaction history */}
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Recent Transactions
      </h3>
      {txLoading ? (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl divide-y divide-gray-700/40">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-800/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-3.5 w-12 bg-gray-800 rounded animate-pulse ml-auto" />
                <div className="h-3 w-16 bg-gray-800/60 rounded animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : txError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-gray-400 mb-3">
            Failed to load transactions
          </p>
          <button
            onClick={() => txRefetch()}
            className="px-4 py-2 text-sm font-medium bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <TransactionList transactions={transactions ?? []} />
      )}
    </div>
  );
}
