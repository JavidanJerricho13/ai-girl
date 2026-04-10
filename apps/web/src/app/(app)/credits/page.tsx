'use client';

import { useAuthStore } from '@/store/auth.store';
import {
  Wallet,
  MessageSquare,
  ImageIcon,
  Mic,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

const PACKAGES = [
  { credits: 500, price: '$4.99', label: 'Starter' },
  { credits: 1200, price: '$9.99', label: 'Popular', highlight: true },
  { credits: 2500, price: '$19.99', label: 'Best Value' },
];

const MOCK_TRANSACTIONS = [
  { desc: 'Chat message', amount: -1, balance: 85, date: 'Today' },
  { desc: 'Image generation', amount: -10, balance: 86, date: 'Today' },
  { desc: 'Voice generation', amount: -3, balance: 96, date: 'Yesterday' },
  { desc: 'Credit purchase', amount: 500, balance: 99, date: 'Yesterday' },
];

export default function CreditsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Balance header */}
      <div className="flex items-center gap-3 mb-8">
        <Wallet className="text-purple-400" size={28} />
        <h2 className="text-2xl font-semibold text-white">
          Credits &amp; Billing
        </h2>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-xl p-6 mb-8">
        <p className="text-sm text-gray-300 mb-1">Current Balance</p>
        <p className="text-4xl font-bold text-white">
          {user?.credits ?? 0}{' '}
          <span className="text-lg font-normal text-gray-400">credits</span>
        </p>
      </div>

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
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Credit Packages
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.credits}
            className={`rounded-xl p-5 text-center border ${
              pkg.highlight
                ? 'bg-purple-900/30 border-purple-600/50 ring-1 ring-purple-500/20'
                : 'bg-gray-800/60 border-gray-700/50'
            }`}
          >
            {pkg.highlight && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 mb-2 block">
                Most Popular
              </span>
            )}
            <p className="text-2xl font-bold text-white">
              {pkg.credits.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400 mb-3">credits</p>
            <button
              disabled
              className="w-full py-2 rounded-lg text-sm font-medium bg-purple-600/50 text-purple-200 cursor-not-allowed"
            >
              {pkg.price}
            </button>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
        Recent Transactions
      </h3>
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl divide-y divide-gray-700/40">
        {MOCK_TRANSACTIONS.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {tx.amount > 0 ? (
                <ArrowUp size={16} className="text-emerald-400" />
              ) : (
                <ArrowDown size={16} className="text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-200">{tx.desc}</p>
                <p className="text-xs text-gray-500">{tx.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {tx.amount > 0 ? '+' : ''}
                {tx.amount}
              </p>
              <p className="text-xs text-gray-500">bal: {tx.balance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
