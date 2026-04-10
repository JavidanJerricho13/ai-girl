'use client';

import { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  MessageSquare,
  ImageIcon,
  Mic,
} from 'lucide-react';

// ── Package data (from API's hardcoded packages) ─────────

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  productId: string;
  isActive: boolean;
  isFeatured: boolean;
}

const PACKAGES: CreditPackage[] = [
  {
    id: '1',
    name: 'Starter',
    credits: 500,
    price: 4.99,
    productId: 'com.ethereal.credits.small',
    isActive: true,
    isFeatured: false,
  },
  {
    id: '2',
    name: 'Popular',
    credits: 1200,
    price: 9.99,
    productId: 'com.ethereal.credits.medium',
    isActive: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Best Value',
    credits: 2500,
    price: 19.99,
    productId: 'com.ethereal.credits.large',
    isActive: true,
    isFeatured: false,
  },
  {
    id: '4',
    name: 'Premium Monthly',
    credits: 1000,
    price: 9.99,
    productId: 'com.ethereal.premium.monthly',
    isActive: true,
    isFeatured: false,
  },
  {
    id: '5',
    name: 'Premium Yearly',
    credits: 15000,
    price: 99.99,
    productId: 'com.ethereal.premium.yearly',
    isActive: true,
    isFeatured: false,
  },
];

// ── Page ─────────────────────────────────────────────────

export default function PackagesPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="text-indigo-400" size={24} />
        <div>
          <h2 className="text-lg font-semibold text-white">
            Credit Packages
          </h2>
          <p className="text-xs text-zinc-500">
            Manage pricing tiers and credit bundles
          </p>
        </div>
      </div>

      {/* Global Pricing */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4">
          Global Credit Costs
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-blue-400" />
              <span className="text-xs text-zinc-400">Chat Message</span>
            </div>
            <span className="text-sm font-mono font-semibold text-white">
              1 cr
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-emerald-400" />
              <span className="text-xs text-zinc-400">Image Gen</span>
            </div>
            <span className="text-sm font-mono font-semibold text-white">
              10 cr
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <Mic size={14} className="text-amber-400" />
              <span className="text-xs text-zinc-400">Voice Gen</span>
            </div>
            <span className="text-sm font-mono font-semibold text-white">
              3 cr
            </span>
          </div>
        </div>
      </div>

      {/* Package grid */}
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Available Packages
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-zinc-900/50 backdrop-blur-md border rounded-xl p-5 transition-colors ${
              pkg.isFeatured
                ? 'border-indigo-600/50 ring-1 ring-indigo-500/20'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">
                  {pkg.name}
                </h4>
                {pkg.isFeatured && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    <Sparkles size={8} />
                    Featured
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  pkg.isActive
                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700/30'
                }`}
              >
                {pkg.isActive ? 'Active' : 'Archived'}
              </span>
            </div>

            {/* Credits + Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold font-mono text-white">
                {pkg.credits.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500">credits</span>
              <span className="text-xs text-zinc-600 ml-auto">
                ${pkg.price.toFixed(2)}
              </span>
            </div>

            {/* Product ID */}
            <div className="mb-3">
              <p className="text-[10px] text-zinc-600 mb-1">Product ID</p>
              <p className="text-[11px] font-mono text-zinc-500 bg-zinc-950/50 rounded px-2 py-1 border border-zinc-800 truncate">
                {pkg.productId}
              </p>
            </div>

            {/* Per credit cost */}
            <p className="text-[10px] text-zinc-500">
              ${(pkg.price / pkg.credits).toFixed(4)} per credit
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
