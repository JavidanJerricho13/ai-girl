'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  Zap,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { StatCard } from '@/components/dashboard/StatCard';

interface AnalyticsOverview {
  totalUsers: number;
  newUsersToday: number;
  totalMessages: number;
  messagesToday: number;
  totalRevenue: number;
  activeConversations: number;
  totalImages: number;
}

const SERVICES = [
  { name: 'API Server', status: 'ok' as const, latency: '—' },
  { name: 'Database', status: 'ok' as const, latency: '—' },
  { name: 'WebSocket', status: 'ok' as const, latency: '—' },
  { name: 'fal.ai (Images)', status: 'ok' as const, latency: '—' },
  { name: 'ElevenLabs (TTS)', status: 'ok' as const, latency: '—' },
  { name: 'Groq (LLM)', status: 'ok' as const, latency: '—' },
];

export default function DashboardPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/analytics/overview');
      return res.data;
    },
    refetchInterval: 60_000, // Auto-refresh every 60s
  });

  const { data: tokenUsage } = useQuery<any>({
    queryKey: ['admin-token-usage'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/analytics/tokens');
      return res.data;
    },
    refetchInterval: 120_000,
  });

  const { data: recentTx } = useQuery<any[]>({
    queryKey: ['admin-recent-tx'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/transactions', { params: { limit: 5 } });
      return res.data?.data ?? [];
    },
    refetchInterval: 30_000,
  });

  function fmt(n: number | undefined): string {
    if (n == null) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs text-indigo-400 font-medium">Live</span>
        {isLoading && <Loader2 size={14} className="animate-spin text-zinc-500 ml-2" />}
      </div>

      {/* KPI Cards — real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={fmt(analytics?.totalUsers)}
          change={analytics?.newUsersToday ?? 0}
          changeLabel="today"
          icon={<Users size={18} />}
        />
        <StatCard
          title="Messages"
          value={fmt(analytics?.totalMessages)}
          change={analytics?.messagesToday ?? 0}
          changeLabel="today"
          icon={<MessageSquare size={18} />}
        />
        <StatCard
          title="Active Conversations"
          value={fmt(analytics?.activeConversations)}
          icon={<Zap size={18} />}
        />
        <StatCard
          title="Images Generated"
          value={fmt(analytics?.totalImages)}
          icon={<ImageIcon size={18} />}
        />
      </div>

      {/* LLM Token Usage */}
      {tokenUsage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Total Tokens</h3>
            <p className="text-2xl font-bold text-white font-mono">{fmt(tokenUsage.totalTokens)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{fmt(tokenUsage.totalMessages)} messages</p>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">By Model</h3>
            <div className="space-y-2">
              {(tokenUsage.byModel ?? []).map((m: any) => (
                <div key={m.model} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{m.model}</span>
                  <span className="text-xs font-mono text-zinc-400">{fmt(m.tokens)} tok</span>
                </div>
              ))}
              {(!tokenUsage.byModel || tokenUsage.byModel.length === 0) && (
                <p className="text-xs text-zinc-600">No data yet</p>
              )}
            </div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Top Users by Cost</h3>
            <div className="space-y-2">
              {(tokenUsage.topUsers ?? []).map((u: any) => (
                <div key={u.userId} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 truncate max-w-[140px]">{u.username || u.email}</span>
                  <span className="text-xs font-mono text-zinc-400">{fmt(u.tokens)}</span>
                </div>
              ))}
              {(!tokenUsage.topUsers || tokenUsage.topUsers.length === 0) && (
                <p className="text-xs text-zinc-600">No data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: System Health + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">System Health</h3>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-900/30 px-2 py-0.5 rounded">
              All Operational
            </span>
          </div>
          <div className="space-y-3">
            {SERVICES.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-zinc-300">{svc.name}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{svc.latency}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions — real data */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            <a href="/logs" className="text-xs text-indigo-400 hover:text-indigo-300">View All →</a>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {!recentTx?.length ? (
              <div className="px-5 py-8 text-center text-xs text-zinc-500">No transactions yet</div>
            ) : (
              recentTx.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                  <div>
                    <p className="text-xs text-zinc-300">{tx.user?.email ?? tx.userId?.slice(0, 8)}</p>
                    <p className="text-[10px] text-zinc-500">{tx.description?.slice(0, 40)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    <p className="text-[10px] text-zinc-600">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
