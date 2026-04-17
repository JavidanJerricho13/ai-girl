'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard,
  Eye,
  Trash2,
  UserCog,
  Plus,
  Search,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before: any;
  after: any;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: string; email: string; username: string | null };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  GRANT_CREDITS: <CreditCard size={14} className="text-emerald-400" />,
  CHANGE_ROLE: <UserCog size={14} className="text-indigo-400" />,
  CHANGE_STATUS: <Shield size={14} className="text-amber-400" />,
  DELETE_CHARACTER: <Trash2 size={14} className="text-rose-400" />,
  TOGGLE_VISIBILITY: <Eye size={14} className="text-sky-400" />,
  CREATE_CHARACTER: <Plus size={14} className="text-emerald-400" />,
  UPDATE_CHARACTER: <UserCog size={14} className="text-indigo-400" />,
  REVIEW_MODERATION: <Shield size={14} className="text-amber-400" />,
};

const ACTION_COLORS: Record<string, string> = {
  GRANT_CREDITS: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
  CHANGE_ROLE: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/30',
  CHANGE_STATUS: 'bg-amber-900/30 text-amber-400 border-amber-800/30',
  DELETE_CHARACTER: 'bg-rose-900/30 text-rose-400 border-rose-800/30',
  TOGGLE_VISIBILITY: 'bg-sky-900/30 text-sky-400 border-sky-800/30',
  CREATE_CHARACTER: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/30',
  UPDATE_CHARACTER: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/30',
  REVIEW_MODERATION: 'bg-amber-900/30 text-amber-400 border-amber-800/30',
};

const ACTION_FILTERS = [
  'All Actions',
  'GRANT_CREDITS',
  'CHANGE_ROLE',
  'CHANGE_STATUS',
  'DELETE_CHARACTER',
  'TOGGLE_VISIBILITY',
  'CREATE_CHARACTER',
  'REVIEW_MODERATION',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('All Actions');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 20 };
      if (actionFilter !== 'All Actions') params.action = actionFilter;
      const res = await apiClient.get('/admin/audit-logs', { params });
      return res.data;
    },
  });

  const logs: AuditLog[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ScrollText className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">Audit Log</h2>
            <p className="text-xs text-zinc-500">
              Every admin action, timestamped and attributed
            </p>
          </div>
        </div>

        {/* Filter */}
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-600"
        >
          {ACTION_FILTERS.map((f) => (
            <option key={f} value={f}>{f.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-sm text-zinc-400 mb-3">Failed to load audit logs</p>
          <button onClick={() => refetch()} className="px-4 py-2 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors">
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ScrollText size={36} className="text-zinc-700 mb-3" />
          <p className="text-sm text-zinc-400">No audit logs found</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">When</th>
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Admin</th>
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Action</th>
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Target</th>
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Description</th>
                <th className="text-left text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-5 py-3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs text-zinc-400">{formatDate(log.createdAt)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-zinc-300">{log.admin?.username || log.admin?.email || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${ACTION_COLORS[log.action] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {ACTION_ICONS[log.action] || <Search size={12} />}
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <span className="text-[10px] text-zinc-500">{log.resourceType}</span>
                      <span className="text-[10px] font-mono text-zinc-600 ml-1.5">{log.resourceId.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-[250px]">
                    <span className="text-xs text-zinc-400 truncate block">{log.description || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    {log.before && log.after ? (
                      <div className="text-[10px] font-mono space-y-0.5">
                        {Object.keys(log.after).map((key) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="text-zinc-600">{key}:</span>
                            <span className="text-rose-400/70 line-through">{JSON.stringify(log.before[key])}</span>
                            <span className="text-zinc-600">→</span>
                            <span className="text-emerald-400">{JSON.stringify(log.after[key])}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-zinc-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
