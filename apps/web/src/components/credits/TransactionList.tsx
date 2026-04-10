'use client';

import { ArrowDown, ArrowUp, ReceiptText } from 'lucide-react';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ReceiptText size={36} className="text-gray-700 mb-3" />
        <p className="text-sm text-gray-400">No transaction history yet</p>
        <p className="text-xs text-gray-600 mt-1">
          Your credit activity will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl divide-y divide-gray-700/40">
      {transactions.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                tx.amount > 0
                  ? 'bg-emerald-900/30'
                  : 'bg-red-900/30'
              }`}
            >
              {tx.amount > 0 ? (
                <ArrowUp size={14} className="text-emerald-400" />
              ) : (
                <ArrowDown size={14} className="text-red-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-200 truncate">
                {tx.description}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(tx.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p
              className={`text-sm font-medium ${
                tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {tx.amount > 0 ? '+' : ''}
              {tx.amount}
            </p>
            <p className="text-xs text-gray-500">
              bal: {tx.balance.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
