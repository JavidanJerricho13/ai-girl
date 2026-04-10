'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { CharacterFilterBar } from '@/components/characters/CharacterFilterBar';
import {
  CharacterTable,
  AdminCharacter,
} from '@/components/characters/CharacterTable';

interface CharactersResponse {
  data: AdminCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEBOUNCE_MS = 300;

export default function CharactersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibility, setVisibility] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [visibility, category]);

  const { data, isLoading, isError, refetch } = useQuery<CharactersResponse>({
    queryKey: ['admin-characters', debouncedSearch, visibility, category, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (visibility) params.isPublic = visibility;
      if (category) params.category = category;
      const res = await apiClient.get('/admin/characters', { params });
      return res.data;
    },
  });

  const characters = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const allSelected =
    characters.length > 0 && characters.every((c) => selectedIds.has(c.id));

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(characters.map((c) => c.id)));
    }
  }, [allSelected, characters]);

  const handleRefresh = useCallback(() => {
    setSelectedIds(new Set());
    refetch();
  }, [refetch]);

  // Bulk actions
  const handleBulkVisibility = async (isPublic: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.patch(`/admin/characters/${id}/visibility`, { isPublic }),
        ),
      );
      handleRefresh();
    } catch {
      alert('Some operations failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Delete ${selectedIds.size} character(s)? This cannot be undone.`,
      )
    )
      return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          apiClient.delete(`/admin/characters/${id}`),
        ),
      );
      handleRefresh();
    } catch {
      alert('Some deletions failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-indigo-400" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-white">
              Character Management
            </h2>
            <p className="text-xs text-zinc-500">
              {total.toLocaleString()} characters total
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <CharacterFilterBar
          search={search}
          onSearchChange={setSearch}
          visibility={visibility}
          onVisibilityChange={setVisibility}
          category={category}
          onCategoryChange={setCategory}
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
              Failed to load characters
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <CharacterTable
            characters={characters}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
            allSelected={allSelected}
            onRefresh={handleRefresh}
          />
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

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm text-zinc-300 font-medium">
            {selectedIds.size} selected
          </span>

          <div className="w-px h-6 bg-zinc-700" />

          <button
            onClick={() => handleBulkVisibility(true)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
          >
            <Eye size={14} />
            Publish
          </button>
          <button
            onClick={() => handleBulkVisibility(false)}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <EyeOff size={14} />
            Unpublish
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>

          <div className="w-px h-6 bg-zinc-700" />

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>

          {bulkLoading && (
            <Loader2 size={14} className="animate-spin text-indigo-400" />
          )}
        </div>
      )}
    </div>
  );
}
