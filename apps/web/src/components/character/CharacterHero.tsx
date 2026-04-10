'use client';

import { useState } from 'react';

interface MediaItem {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
}

interface CharacterHeroProps {
  name: string;
  media: MediaItem[];
}

export function CharacterHero({ name, media }: CharacterHeroProps) {
  const profileImage = media.find((m) => m.type === 'profile');
  const galleryImages = media
    .filter((m) => m.type === 'gallery')
    .sort((a, b) => a.order - b.order);

  const allImages = [
    ...(profileImage ? [profileImage] : []),
    ...galleryImages,
  ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = allImages[selectedIdx];

  return (
    <div>
      {/* Main image */}
      <div className="aspect-[3/4] bg-gray-800 border border-gray-700/50 rounded-xl overflow-hidden">
        {selected ? (
          <img
            src={selected.url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <span className="text-6xl font-bold text-gray-600">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Gallery strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {allImages.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelectedIdx(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                i === selectedIdx
                  ? 'border-purple-500'
                  : 'border-gray-700/50 hover:border-gray-600'
              }`}
            >
              <img
                src={m.thumbnailUrl || m.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
