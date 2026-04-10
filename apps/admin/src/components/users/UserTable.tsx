'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  Shield,
  Ban,
  Coins,
  Loader2,
  X,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import apiClient from '@/lib/api-client';

export interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  credits: number;
  isPremium: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserTableProps {
  users: AdminUser[];
  onRefresh: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Action Menu ──────────────────────────────────────────

function ActionMenu({
  user,
  onRefresh,
}: {
  user: AdminUser;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roleDropdown, setRoleDropdown] = useState(false);
  const [creditsModal, setCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeRole = async (newRole: string) => {
    setIsLoading(true);
    try {
      await apiClient.patch(`/admin/users/${user.id}/role`, { role: newRole });
      onRefresh();
    } catch {
      alert('Failed to update role');
    } finally {
      setIsLoading(false);
      setRoleDropdown(false);
      setOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await apiClient.patch(`/admin/users/${user.id}/status`, {
        isActive: !user.isActive,
      });
      onRefresh();
    } catch {
      alert('Failed to update status');
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };

  const handleSendCredits = async () => {
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setIsLoading(true);
    try {
      await apiClient.patch(`/admin/users/${user.id}/credits`, {
        amount,
        description: 'Admin credit grant',
      });
      onRefresh();
    } catch {
      alert('Failed to send credits');
    } finally {
      setIsLoading(false);
      setCreditsModal(false);
      setCreditAmount('');
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setRoleDropdown(false);
            }}
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Change Role */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdown(!roleDropdown)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700/60 transition-colors"
              >
                <Shield size={14} />
                Change Role
              </button>
              {roleDropdown && (
                <div className="border-t border-zinc-700/50 bg-zinc-850">
                  {['ADMIN', 'MODERATOR', 'USER'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleChangeRole(role)}
                      disabled={isLoading || user.role === role}
                      className={`w-full text-left px-6 py-2 text-xs transition-colors ${
                        user.role === role
                          ? 'text-indigo-400 bg-indigo-900/20'
                          : 'text-zinc-400 hover:bg-zinc-700/40'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ban/Unban */}
            <button
              onClick={handleToggleStatus}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700/60 transition-colors"
            >
              <Ban size={14} />
              {user.isActive ? 'Ban User' : 'Unban User'}
            </button>

            {/* Send Credits */}
            <button
              onClick={() => {
                setCreditsModal(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-700/60 transition-colors"
            >
              <Coins size={14} />
              Send Credits
            </button>
          </div>
        </>
      )}

      {/* Credits modal */}
      {creditsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setCreditsModal(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-full max-w-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">
                Send Credits
              </h4>
              <button
                onClick={() => setCreditsModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              To: {user.email}
            </p>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Amount"
              min="1"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 mb-3"
              autoFocus
            />
            <button
              onClick={handleSendCredits}
              disabled={
                isLoading || !creditAmount || parseInt(creditAmount) <= 0
              }
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────

export function UserTable({ users, onRefresh }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-zinc-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right">
              Credits
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Joined
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-10" />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const name =
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.username || user.email.split('@')[0];
            const initial = name.charAt(0).toUpperCase();

            return (
              <tr
                key={user.id}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
              >
                {/* User */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-semibold shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <StatusBadge type="role" value={user.role} />
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge
                    type="status"
                    value={user.isActive ? 'active' : 'banned'}
                  />
                </td>

                {/* Credits */}
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-mono text-zinc-300">
                    {user.credits.toLocaleString()}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-500">
                    {formatDate(user.createdAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <ActionMenu user={user} onRefresh={onRefresh} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
