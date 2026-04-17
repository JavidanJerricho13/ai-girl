'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Crown, MessageSquare, Star } from 'lucide-react';

export interface CharacterCardData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  conversationCount: number;
  avgRating: number | null;
  tags?: string[];
  media: Array<{ url: string; type: string; thumbnailUrl?: string | null }>;
}

interface CharacterCardProps {
  character: CharacterCardData;
  size?: 'standard' | 'spotlight';
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function CharacterCard({ character, size = 'standard' }: CharacterCardProps) {
  const profileImage = character.media?.find((m) => m.type === 'profile');
  const isSpotlight = size === 'spotlight';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link
        href={`/characters/${character.id}`}
        className="group block glass-card rounded-2xl overflow-hidden cursor-pointer"
      >
        {/* Image */}
        <div className={`relative overflow-hidden ${isSpotlight ? 'aspect-[2/1]' : 'aspect-[3/4]'}`}>
          {profileImage ? (
            <Image
              src={profileImage.url}
              alt={character.displayName || character.name}
              fill
              sizes={isSpotlight
                ? '(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw'
                : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              {...(profileImage.thumbnailUrl ? {
                placeholder: 'blur' as const,
                blurDataURL: profileImage.thumbnailUrl,
              } : {})}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <span className="text-5xl font-bold text-gray-600">
                {(character.displayName || character.name).charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient overlay — intensifies on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Premium badge */}
          {character.isPremium && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-900/80 backdrop-blur-sm">
              <Crown size={12} className="text-yellow-400" />
              <span className="text-[10px] font-semibold text-yellow-300">
                PRO
              </span>
            </div>
          )}

          {/* Info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-semibold text-white truncate">
              {character.displayName || character.name}
            </h3>
            <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">
              {character.description}
            </p>

            {/* Tags — visible on hover */}
            {character.tags && character.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 max-h-0 overflow-hidden opacity-0 group-hover:max-h-10 group-hover:opacity-100 transition-all duration-300">
                {character.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-lilac/15 text-lilac/80">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} />
            {formatCount(character.conversationCount)}
          </span>
          {character.avgRating != null && (
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {character.avgRating.toFixed(1)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
