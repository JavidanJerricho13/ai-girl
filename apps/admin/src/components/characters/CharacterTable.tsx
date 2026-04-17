'use client';

import { useState } from 'react';
import {
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SortableHeader } from '@/components/common/SortableHeader';
import apiClient from '@/lib/api-client';

export interface AdminCharacter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPublic: boolean;
  isPremium: boolean;
  isOfficial: boolean;
  category: string[];
  conversationCount: number;
  messageCount: number;
  createdAt: string;
  media: Array<{ url: string; type: string }>;
  creator: { id: string; username: string | null; email: string };
}

interface CharacterTableProps {
  characters: AdminCharacter[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  onRefresh: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function CharacterTable({
  characters,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  allSelected,
  onRefresh,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSort,
}: CharacterTableProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character? This cannot be undone.')) return;
    setLoadingAction(id);
    try {
      await apiClient.delete(`/admin/characters/${id}`);
      toast.success('Character deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete character');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleVisibility = async (char: AdminCharacter) => {
    setLoadingAction(char.id);
    try {
      await apiClient.patch(`/admin/characters/${char.id}/visibility`, {
        isPublic: !char.isPublic,
      });
      toast.success(`Character ${!char.isPublic ? 'published' : 'unpublished'}`);
      onRefresh();
    } catch {
      toast.error('Failed to update visibility');
    } finally {
      setLoadingAction(null);
    }
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-zinc-500">No characters found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-600 focus:ring-offset-0"
              />
            </th>
            <SortableHeader label="Character" field="name" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort || (() => {})} className="px-4" />
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Creator
            </th>
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Status
            </th>
            <SortableHeader label="Stats" field="conversationCount" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort || (() => {})} className="px-4 text-right" />
            <SortableHeader label="Created" field="createdAt" currentSort={sortBy} currentOrder={sortOrder} onSort={onSort || (() => {})} className="px-4" />
            <th className="px-4 py-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider w-28" />
          </tr>
        </thead>
        <tbody>
          {characters.map((char) => {
            const name = char.displayName || char.name;
            const avatarUrl = char.media?.find(
              (m) => m.type === 'profile',
            )?.url;
            const initial = name.charAt(0).toUpperCase();
            const selected = selectedIds.has(char.id);
            const isActionLoading = loadingAction === char.id;

            return (
              <tr
                key={char.id}
                className={`border-b border-zinc-800/50 transition-colors ${
                  selected
                    ? 'bg-indigo-900/10'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                {/* Checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(char.id)}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-600 focus:ring-offset-0"
                  />
                </td>

                {/* Character */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm font-semibold shrink-0">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {name}
                      </p>
                      <div className="flex gap-1 mt-0.5">
                        {char.category.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Creator */}
                <td className="px-4 py-3">
                  <p className="text-xs text-zinc-400 truncate">
                    {char.creator?.username || char.creator?.email || '—'}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        char.isPublic
                          ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700/30'
                      }`}
                    >
                      {char.isPublic ? 'Public' : 'Private'}
                    </span>
                    {char.isPremium && (
                      <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-1.5 py-0.5 rounded border border-yellow-700/30">
                        PRO
                      </span>
                    )}
                  </div>
                </td>

                {/* Stats */}
                <td className="px-4 py-3 text-right">
                  <p className="text-xs text-zinc-300 font-mono">
                    {formatCount(char.conversationCount)} chats
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {formatCount(char.messageCount)} msgs
                  </p>
                </td>

                {/* Created */}
                <td className="px-4 py-3">
                  <span className="text-xs text-zinc-500">
                    {formatDate(char.createdAt)}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleVisibility(char)}
                      disabled={isActionLoading}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                      title={
                        char.isPublic ? 'Make Private' : 'Make Public'
                      }
                    >
                      {isActionLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : char.isPublic ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    <a
                      href={`http://localhost:3000/characters/${char.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="View on site"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(char.id)}
                      disabled={isActionLoading}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
