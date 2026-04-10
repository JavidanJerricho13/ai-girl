'use client';

import { GalleryItem, GalleryItemData } from './GalleryItem';
import { ImageIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface GalleryGridProps {
  items: GalleryItemData[];
  onItemClick: (item: GalleryItemData) => void;
}

export function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-800/60 flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Your gallery is empty
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Generate some magic in the chat to fill your gallery!
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Sparkles size={16} />
          Discover Characters
        </Link>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {items.map((item) => (
        <GalleryItem key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
}
