'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ImageIcon, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { GalleryGrid } from '@/components/media/GalleryGrid';
import { ImageLightbox } from '@/components/media/ImageLightbox';
import { GalleryItemData } from '@/components/media/GalleryItem';

type TabFilter = 'all' | 'image' | 'voice';

const TABS: Array<{ label: string; value: TabFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Images', value: 'image' },
  { label: 'Voice', value: 'voice' },
];

const LIMIT = 20;

async function fetchHistory(
  offset: number,
  filter: TabFilter,
): Promise<GalleryItemData[]> {
  const params: Record<string, string | number> = { limit: LIMIT, offset };
  if (filter !== 'all') params.type = filter;
  const res = await apiClient.get('/media/generate/history', { params });
  return res.data?.data ?? res.data ?? [];
}

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItemData | null>(
    null,
  );

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['gallery', activeTab],
    queryFn: ({ pageParam = 0 }) => fetchHistory(pageParam, activeTab),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) return undefined;
      return allPages.reduce((sum, page) => sum + page.length, 0);
    },
  });

  const items =
    data?.pages
      .flat()
      .filter((item) => item.resultUrl && item.status === 'COMPLETED') ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="text-purple-400" size={28} />
          <h2 className="text-2xl font-semibold text-white">My Gallery</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/40 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 bg-gray-800/50 border border-gray-700/50 rounded-xl animate-pulse"
              style={{ height: `${180 + (i % 3) * 60}px` }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
            <span className="text-red-400 text-xl font-bold">!</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            Failed to load gallery
          </h3>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <GalleryGrid items={items} onItemClick={setLightboxItem} />

          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
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

      {/* Lightbox */}
      {lightboxItem && (
        <ImageLightbox
          item={lightboxItem}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </div>
  );
}
