'use client';

import { useState } from 'react';
import { ImageOff, Play, Volume2 } from 'lucide-react';

export interface GalleryItemData {
  id: string;
  type: string;
  prompt: string | null;
  resultUrl: string | null;
  characterId: string | null;
  status: string;
  createdAt: string;
}

interface GalleryItemProps {
  item: GalleryItemData;
  onClick: (item: GalleryItemData) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function GalleryItem({ item, onClick }: GalleryItemProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isImage = item.type === 'image';
  const isVoice = item.type === 'voice';

  if (!item.resultUrl || item.status !== 'COMPLETED') {
    return null;
  }

  if (isVoice) {
    return (
      <button
        onClick={() => onClick(item)}
        className="break-inside-avoid mb-4 w-full bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:bg-gray-800 hover:border-gray-600 transition-colors text-left group"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-900/40 flex items-center justify-center shrink-0">
            <Volume2 size={18} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-amber-400 mb-0.5">
              Voice
            </p>
            <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
          </div>
          <div className="ml-auto w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Play size={14} className="text-white ml-0.5" />
          </div>
        </div>
        {item.prompt && (
          <p className="text-xs text-gray-400 line-clamp-2">{item.prompt}</p>
        )}
      </button>
    );
  }

  // Image
  return (
    <button
      onClick={() => onClick(item)}
      className="break-inside-avoid mb-4 w-full rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-purple-600/40 hover:shadow-lg hover:shadow-purple-900/10 transition-all group relative"
    >
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="w-full aspect-square bg-gray-800 animate-pulse" />
      )}

      {error ? (
        <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
          <ImageOff size={24} className="text-gray-600" />
        </div>
      ) : (
        <img
          src={item.resultUrl}
          alt={item.prompt || 'Generated image'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0 h-0'
          }`}
        />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        <p className="text-xs text-white/80 line-clamp-2">
          {item.prompt || 'Generated image'}
        </p>
        <p className="text-[10px] text-white/50 mt-1">
          {formatDate(item.createdAt)}
        </p>
      </div>
    </button>
  );
}
