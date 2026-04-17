'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff, ZoomIn } from 'lucide-react';

interface InlineImageProps {
  src: string;
  alt?: string;
  onClick?: () => void;
}

export function InlineImage({
  src,
  alt = 'Generated image',
  onClick,
}: InlineImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-40 bg-gray-800/50 border border-gray-700/50 rounded-xl">
        <div className="text-center">
          <ImageOff size={24} className="text-gray-600 mx-auto mb-1" />
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block relative cursor-pointer group w-full text-left"
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="w-full h-52 bg-gray-700/50 rounded-xl animate-pulse" />
      )}

      <Image
        src={src}
        alt={alt}
        width={512}
        height={512}
        sizes="(max-width: 768px) 80vw, 400px"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`rounded-xl max-h-80 w-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Hover overlay */}
      {loaded && (
        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/50 rounded-full">
            <ZoomIn size={18} className="text-white" />
          </div>
        </div>
      )}
    </button>
  );
}
