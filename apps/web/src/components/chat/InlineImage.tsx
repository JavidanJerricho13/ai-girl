'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface InlineImageProps {
  src: string;
  alt?: string;
}

export function InlineImage({ src, alt = 'Generated image' }: InlineImageProps) {
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
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative cursor-pointer group"
    >
      {/* Skeleton */}
      {!loaded && (
        <div className="w-full h-52 bg-gray-700/50 rounded-xl animate-pulse" />
      )}

      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`rounded-xl max-h-80 w-full object-cover transition-opacity duration-300 group-hover:opacity-90 ${
          loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
      />

      {/* Hover overlay */}
      {loaded && (
        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 transition-colors" />
      )}
    </a>
  );
}
