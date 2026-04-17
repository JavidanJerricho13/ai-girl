'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Compass, Search, X, Loader2, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { CategoryChips, Category } from '@/components/character/CategoryChips';
import { CharacterGrid } from '@/components/character/CharacterGrid';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CharacterGridSkeleton } from '@/components/character/CharacterCardSkeleton';
import { CharacterCard, CharacterCardData } from '@/components/character/CharacterCard';

const LIMIT = 20;
const DEBOUNCE_MS = 300;

async function fetchCharacters({
  category,
  offset,
  search,
}: {
  category: Category;
  offset: number;
  search: string;
}): Promise<CharacterCardData[]> {
  const params: Record<string, string | number | boolean> = {
    isPublic: true,
    limit: LIMIT,
    offset,
  };
  if (category !== 'All') {
    params.category = category;
  }
  if (search.trim()) {
    params.search = search.trim();
  }
  const res = await apiClient.get('/characters', { params });
  return res.data?.data ?? res.data ?? [];
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function DiscoverPage() {
  const [category, setCategory] = useState<Category>('All');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, DEBOUNCE_MS);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['characters', category, debouncedSearch],
    queryFn: ({ pageParam = 0 }) =>
      fetchCharacters({ category, offset: pageParam, search: debouncedSearch }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
  });

  const { data: recommended } = useQuery<Array<CharacterCardData & { matchScore?: number }>>({
    queryKey: ['characters', 'recommended'],
    queryFn: async () => {
      const res = await apiClient.get('/characters/recommended');
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const characters = data?.pages.flat() ?? [];

  const handleClearSearch = () => {
    setSearchInput('');
    inputRef.current?.focus();
  };

  return (
    <div>
      {/* Search + filters — compact header */}
      <div className="mb-6 space-y-4">
        {/* Search bar — full width, prominent */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search characters..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-11 pr-10 py-3 glass border-white/10 rounded-2xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-lilac/30 focus:ring-1 focus:ring-lilac/20 transition-colors"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {/* For You — personality-matched recommendations */}
      {recommended && recommended.length > 0 && !debouncedSearch && category === 'All' && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-lilac" />
            <h3 className="font-display text-fluid-base text-white">For You</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {recommended.map((char) => (
              <div key={char.id} className="snap-start shrink-0 w-[200px]">
                <CharacterCard character={char} size="standard" />
                {char.matchScore != null && (
                  <p className="mt-1.5 text-center text-fluid-xs text-lilac/70">
                    {char.matchScore}% match
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

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
          <ErrorBoundary>
            <CharacterGrid
              characters={characters}
              searchQuery={debouncedSearch}
            />
          </ErrorBoundary>

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
