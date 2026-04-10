'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Shield,
  Ban,
  Coins,
  MessageSquare,
  ImageIcon,
  Mic,
  Users,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { StatusBadge } from '@/components/users/StatusBadge';

// ── Types ────────────────────────────────────────────────

interface UserDetail {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  credits: number;
  isPremium: boolean;
  premiumUntil: string | null;
  isActive: boolean;
  isVerified: boolean;
  language: string;
  nsfwEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    conversations: number;
    messages: number;
    characters: number;
    transactions: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    createdAt: string;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Helpers ──────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// ── Credit Modal ─────────────────────────────────────────

function CreditAdjustmentModal({
  userId,
  onClose,
  onDone,
}: {
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const num = parseInt(amount, 10);
    if (isNaN(num) || num === 0) return;
    setIsLoading(true);
    try {
      await apiClient.patch(`/admin/users/${userId}/credits`, {
        amount: num,
        description: reason || 'Admin adjustment',
      });
      onDone();
      onClose();
    } catch {
      alert('Failed to adjust credits');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-white">Adjust Credits</h4>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Amount (positive to add, negative to remove)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500 or -100"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Compensation for bug"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !amount || parseInt(amount) === 0}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function UserDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserDetail>({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}`);
      return res.data;
    },
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-user', id] });

  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChangeRole = async (newRole: string) => {
    setRoleLoading(true);
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role: newRole });
      refresh();
    } catch {
      alert('Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const action = user.isActive ? 'ban' : 'unban';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setStatusLoading(true);
    try {
      await apiClient.patch(`/admin/users/${id}/status`, {
        isActive: !user.isActive,
      });
      refresh();
    } catch {
      alert('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-zinc-400 mb-3">User not found</p>
        <Link href="/users" className="text-sm text-indigo-400 hover:text-indigo-300">
          Back to Users
        </Link>
      </div>
    );
  }

  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();
  const totalSpent = user.recentTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div>
      {/* Back */}
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Users
      </Link>

      {/* Hero header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img src={user.avatar} alt={displayName} className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-500">
              {initial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <StatusBadge type="role" value={user.role} />
              <StatusBadge type="status" value={user.isActive ? 'active' : 'banned'} />
            </div>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-zinc-600">{id.slice(0, 12)}...</span>
              <button onClick={handleCopyId} className="text-zinc-600 hover:text-zinc-400">
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Last seen: {formatRelative(user.lastLoginAt)}
        </p>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Column 1: Profile & Controls */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Profile & Controls</h3>

          <div className="space-y-4">
            {/* Role changer */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1.5">Role</p>
              <div className="flex gap-1.5">
                {['USER', 'MODERATOR', 'ADMIN'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleChangeRole(role)}
                    disabled={roleLoading || user.role === role}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg border transition-colors ${
                      user.role === role
                        ? 'bg-indigo-900/30 border-indigo-600 text-indigo-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    } disabled:opacity-50`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Ban/Unban */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1.5">Account Status</p>
              <button
                onClick={handleToggleStatus}
                disabled={statusLoading}
                className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                  user.isActive
                    ? 'bg-red-900/20 border border-red-800/30 text-red-400 hover:bg-red-900/30'
                    : 'bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/30'
                }`}
              >
                {statusLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Ban size={14} />
                )}
                {user.isActive ? 'Ban User' : 'Unban User'}
              </button>
            </div>

            {/* Info */}
            <div className="pt-3 border-t border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Joined</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Language</span>
                <span>{user.language === 'az' ? 'Azerbaijani' : 'English'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>NSFW</span>
                <span>{user.nsfwEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Verified</span>
                <span>{user.isVerified ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Financial */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Financial</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-950/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-white">{user.credits.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500">Current Balance</p>
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-red-400">{totalSpent.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-500">Total Spent</p>
            </div>
          </div>

          {user.isPremium && (
            <div className="mb-4 p-3 bg-yellow-900/10 border border-yellow-800/20 rounded-lg">
              <p className="text-xs text-yellow-400 font-medium">Premium Active</p>
              {user.premiumUntil && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Until {formatDate(user.premiumUntil)}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => setShowCreditModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Coins size={14} />
            Adjust Credits
          </button>
        </div>

        {/* Column 3: Engagement */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Engagement</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-blue-400" />
                <span className="text-xs text-zinc-400">Conversations</span>
              </div>
              <span className="text-sm font-mono font-semibold text-white">
                {user._count.conversations}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-400" />
                <span className="text-xs text-zinc-400">Messages</span>
              </div>
              <span className="text-sm font-mono font-semibold text-white">
                {user._count.messages}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-2">
                <ImageIcon size={14} className="text-amber-400" />
                <span className="text-xs text-zinc-400">Characters Created</span>
              </div>
              <span className="text-sm font-mono font-semibold text-white">
                {user._count.characters}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-purple-400" />
                <span className="text-xs text-zinc-400">Transactions</span>
              </div>
              <span className="text-sm font-mono font-semibold text-white">
                {user._count.transactions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-300">Recent Transactions</h3>
        </div>
        {user.recentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-zinc-500">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {user.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    tx.amount > 0 ? 'bg-emerald-900/30' : 'bg-red-900/30'
                  }`}>
                    {tx.amount > 0 ? (
                      <ArrowUp size={12} className="text-emerald-400" />
                    ) : (
                      <ArrowDown size={12} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-300">{tx.description}</p>
                    <p className="text-[10px] text-zinc-600">{tx.type} · {formatRelative(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-mono font-medium ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-mono">
                    bal: {tx.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credit modal */}
      {showCreditModal && (
        <CreditAdjustmentModal
          userId={id}
          onClose={() => setShowCreditModal(false)}
          onDone={refresh}
        />
      )}
    </div>
  );
}
