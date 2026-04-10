'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Compass, Search, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { CategoryChips, Category } from '@/components/character/CategoryChips';
import { CharacterGrid } from '@/components/character/CharacterGrid';
import { CharacterGridSkeleton } from '@/components/character/CharacterCardSkeleton';
import { CharacterCardData } from '@/components/character/CharacterCard';

const LIMIT = 20;

async function fetchCharacters({
  category,
  offset,
}: {
  category: Category;
  offset: number;
}): Promise<CharacterCardData[]> {
  const params: Record<string, string | number | boolean> = {
    isPublic: true,
    limit: LIMIT,
    offset,
  };
  if (category !== 'All') {
    params.category = category;
  }
  const res = await apiClient.get('/characters', { params });
  return res.data?.data ?? res.data ?? [];
}

export default function DiscoverPage() {
  const [category, setCategory] = useState<Category>('All');

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['characters', category],
    queryFn: ({ pageParam = 0 }) =>
      fetchCharacters({ category, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
  });

  const characters = data?.pages.flat() ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Compass className="text-purple-400" size={28} />
          <h2 className="text-2xl font-semibold text-white">
            Discover Characters
          </h2>
        </div>
        <div className="relative hidden sm:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search characters..."
            disabled
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 placeholder-gray-500 w-64 cursor-not-allowed opacity-50"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-6">
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {/* Content */}
      {isLoading ? (
        <CharacterGridSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
            <span className="text-red-400 text-xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Failed to load characters
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <CharacterGrid characters={characters} />

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
