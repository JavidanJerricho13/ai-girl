'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCog, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { UserFilterBar } from '@/components/users/UserFilterBar';
import { UserTable, AdminUser } from '@/components/users/UserTable';

interface UsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEBOUNCE_MS = 300;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when role changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const { data, isLoading, isError, refetch } = useQuery<UsersResponse>({
    queryKey: ['admin-users', debouncedSearch, roleFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      const res = await apiClient.get('/admin/users', { params });
      return res.data;
    },
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">
              User Management
            </h2>
            <p className="text-xs text-zinc-500">
              {total.toLocaleString()} users total
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <UserFilterBar
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <p className="text-sm text-zinc-400 mb-3">
              Failed to load users
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <UserTable users={users} onRefresh={() => refetch()} />
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
