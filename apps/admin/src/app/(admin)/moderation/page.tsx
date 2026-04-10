'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────

interface PendingCharacter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  isPublic: boolean;
  category: string[];
  createdAt: string;
  media: Array<{ url: string; type: string }>;
  creator: { id: string; username: string | null; email: string };
}

interface ModerationLog {
  id: string;
  contentType: string;
  contentId: string;
  isViolation: boolean;
  categories: string[];
  confidence: number;
  action: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

type TabKey = 'pending' | 'flagged';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'pending', label: 'Pending Characters' },
  { key: 'flagged', label: 'Flagged Content' },
];

// ── Helpers ──────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Pending Character Card ───────────────────────────────

function PendingCard({
  character,
  onApprove,
  onReject,
}: {
  character: PendingCharacter;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const avatarUrl = character.media?.find((m) => m.type === 'profile')?.url;
  const name = character.displayName || character.name;

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await apiClient.patch(`/admin/characters/${character.id}/visibility`, {
        isPublic: true,
      });
      onApprove();
    } catch {
      alert('Failed to approve');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!confirm('Reject this character? It will remain private.')) return;
    setLoading('reject');
    try {
      // Keep private — already is
      onReject();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold text-zinc-500 shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {name}
            </h4>
            {character.category.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mb-1">
            by {character.creator?.username || character.creator?.email} ·{' '}
            {formatRelative(character.createdAt)}
          </p>
          <p className="text-xs text-zinc-400 line-clamp-2">
            {character.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'approve' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCircle size={12} />
            )}
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'reject' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <XCircle size={12} />
            )}
            Reject
          </button>
          <Link
            href={`/characters/${character.id}/edit`}
            className="px-3 py-1.5 border border-indigo-600 text-indigo-400 text-xs font-medium rounded-lg hover:bg-indigo-900/20 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Collapsible system prompt */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-3 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide' : 'View'} System Prompt
      </button>
      {expanded && (
        <pre className="mt-2 p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
          {character.systemPrompt}
        </pre>
      )}
    </div>
  );
}

// ── Flagged Content Card ─────────────────────────────────

function FlaggedCard({
  log,
  onAction,
}: {
  log: ModerationLog;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      await apiClient.patch(`/admin/moderation/logs/${log.id}`, { action });
      onAction();
    } catch {
      alert('Failed to update');
    } finally {
      setLoading(null);
    }
  };

  const isReviewed = !!log.action;

  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur-md border rounded-xl p-5 ${
        isReviewed ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className={log.isViolation ? 'text-rose-400' : 'text-amber-400'}
          />
          <span className="text-xs font-semibold text-zinc-300">
            {log.contentType.toUpperCase()}
          </span>
          <span className="text-[10px] font-mono text-zinc-600">
            {log.contentId.slice(0, 8)}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">
          {formatRelative(log.createdAt)}
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {log.categories.map((cat) => (
          <span
            key={cat}
            className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-900/30 text-rose-400 border border-rose-800/30"
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-zinc-500">Confidence:</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full max-w-[120px]">
          <div
            className={`h-full rounded-full ${
              log.confidence > 0.8
                ? 'bg-rose-500'
                : log.confidence > 0.5
                  ? 'bg-amber-500'
                  : 'bg-zinc-500'
            }`}
            style={{ width: `${log.confidence * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          {(log.confidence * 100).toFixed(0)}%
        </span>
      </div>

      {/* Status / Actions */}
      {isReviewed ? (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
              log.action === 'allowed'
                ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30'
                : 'bg-rose-900/30 text-rose-400 border-rose-800/30'
            }`}
          >
            {log.action}
          </span>
          <span className="text-[10px] text-zinc-600">Reviewed</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction('allowed')}
            disabled={loading !== null}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'allowed' ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <CheckCircle size={10} />
            )}
            Allow
          </button>
          <button
            onClick={() => handleAction('blocked')}
            disabled={loading !== null}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'blocked' ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <XCircle size={10} />
            )}
            Block
          </button>
          <button
            onClick={() => handleAction('flagged')}
            disabled={loading !== null}
            className="px-2.5 py-1.5 border border-zinc-700 text-zinc-400 text-[11px] font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => setPage(1), [activeTab]);

  // Pending characters (private = not yet approved)
  const pending = useQuery({
    queryKey: ['admin-pending-characters', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/characters', {
        params: { isPublic: 'false', page, limit: 10 },
      });
      return res.data;
    },
    enabled: activeTab === 'pending',
  });

  // Moderation logs
  const flagged = useQuery({
    queryKey: ['admin-moderation-logs', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/moderation/logs', {
        params: { page, limit: 10 },
      });
      return res.data;
    },
    enabled: activeTab === 'flagged',
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pending-characters'] });
    queryClient.invalidateQueries({ queryKey: ['admin-moderation-logs'] });
  };

  const currentData = activeTab === 'pending' ? pending : flagged;
  const totalPages = currentData.data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-indigo-400" size={24} />
        <div>
          <h2 className="text-lg font-semibold text-white">Moderation Queue</h2>
          <p className="text-xs text-zinc-500">
            Review content and manage approvals
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900/50 rounded-lg p-1 w-fit border border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentData.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : currentData.isError ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-400 mb-3">Failed to load</p>
          <button
            onClick={() => currentData.refetch()}
            className="px-4 py-2 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Pending tab */}
          {activeTab === 'pending' && (
            <>
              {(pending.data?.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                    <Sparkles size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                    All clear!
                  </h3>
                  <p className="text-sm text-zinc-500">
                    No pending characters to review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(pending.data?.data ?? []).map(
                    (char: PendingCharacter) => (
                      <PendingCard
                        key={char.id}
                        character={char}
                        onApprove={handleRefresh}
                        onReject={handleRefresh}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )}

          {/* Flagged tab */}
          {activeTab === 'flagged' && (
            <>
              {(flagged.data?.data ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center mb-4">
                    <ShieldCheck size={28} className="text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-300 mb-2">
                    No flagged content
                  </h3>
                  <p className="text-sm text-zinc-500">
                    The AI moderation system has nothing to report.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(flagged.data?.data ?? []).map((log: ModerationLog) => (
                    <FlaggedCard
                      key={log.id}
                      log={log}
                      onAction={handleRefresh}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
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
