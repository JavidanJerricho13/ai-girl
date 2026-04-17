'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BarChart3,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  ImageIcon,
  Mic,
  Coins,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { downloadCSV } from '@/lib/csv';

// ── Types ────────────────────────────────────────────────

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  paymentMethod: string | null;
  paymentId: string | null;
  createdAt: string;
  user: { id: string; email: string; username: string | null };
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TYPE_STYLES: Record<string, string> = {
  EARN: 'bg-emerald-900/30 text-emerald-400 border-emerald-700/30',
  SPEND: 'bg-red-900/30 text-red-400 border-red-700/30',
  PURCHASE: 'bg-indigo-900/30 text-indigo-400 border-indigo-700/30',
  REFUND: 'bg-amber-900/30 text-amber-400 border-amber-700/30',
  SUBSCRIPTION: 'bg-violet-900/30 text-violet-400 border-violet-700/30',
};

const TYPES = ['EARN', 'SPEND', 'PURCHASE', 'REFUND', 'SUBSCRIPTION'];

const DEBOUNCE_MS = 300;

// ── Page ─────────────────────────────────────────────────

export default function TransactionLogsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [typeFilter]);

  const { data, isLoading, isError, refetch } = useQuery<TransactionsResponse>(
    {
      queryKey: ['admin-transactions', debouncedSearch, typeFilter, page],
      queryFn: async () => {
        const params: Record<string, string | number> = { page, limit };
        if (debouncedSearch) params.search = debouncedSearch;
        if (typeFilter) params.type = typeFilter;
        const res = await apiClient.get('/admin/transactions', { params });
        return res.data;
      },
    },
  );

  const transactions = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">
              Transaction Logs
            </h2>
            <p className="text-xs text-zinc-500">
              {total.toLocaleString()} transactions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const res = await apiClient.get('/admin/transactions', { params: { limit: 100 } });
                const txs = res.data?.data ?? [];
                downloadCSV(
                  txs.map((t: any) => ({
                    id: t.id,
                    user: t.user?.email ?? t.userId,
                    type: t.type,
                    amount: t.amount,
                    balance: t.balance,
                    description: t.description,
                    createdAt: t.createdAt,
                  })),
                  'ethereal-transactions',
                );
                toast.success(`Exported ${txs.length} transactions`);
              } catch {
                toast.error('Export failed');
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {/* Pricing info */}
        <div className="hidden md:flex items-center gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <MessageSquare size={10} />
            <span>Chat: 1 cr</span>
          </div>
          <div className="flex items-center gap-1">
            <ImageIcon size={10} />
            <span>Image: 10 cr</span>
          </div>
          <div className="flex items-center gap-1">
            <Mic size={10} />
            <span>Voice: 3 cr</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user email..."
            className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors appearance-none cursor-pointer"
        >
          <option value="">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-400 mb-3">Failed to load</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Coins size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-zinc-600">
                        {tx.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${tx.userId}`}
                        className="text-xs text-zinc-300 hover:text-indigo-400 transition-colors"
                      >
                        {tx.user?.username || tx.user?.email || tx.userId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          TYPE_STYLES[tx.type] ?? TYPE_STYLES.EARN
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-400 truncate block max-w-[200px]">
                        {tx.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {tx.amount > 0 ? (
                          <ArrowUp size={10} className="text-emerald-400" />
                        ) : (
                          <ArrowDown size={10} className="text-red-400" />
                        )}
                        <span
                          className={`text-xs font-mono font-medium ${
                            tx.amount > 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {tx.amount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-mono text-zinc-400">
                        {tx.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
