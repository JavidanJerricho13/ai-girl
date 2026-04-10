import Link from 'next/link';
import { Crown, MessageSquare, Star } from 'lucide-react';

export interface CharacterCardData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  conversationCount: number;
  avgRating: number | null;
  media: Array<{ url: string; type: string }>;
}

interface CharacterCardProps {
  character: CharacterCardData;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function CharacterCard({ character }: CharacterCardProps) {
  const profileImage = character.media?.find((m) => m.type === 'profile');

  return (
    <Link
      href={`/characters/${character.id}`}
      className="group block bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-purple-600/40 hover:shadow-lg hover:shadow-purple-900/20"
    >
      {/* Image */}
      <div className="aspect-[3/4] bg-gray-800 relative overflow-hidden">
        {profileImage ? (
          <img
            src={profileImage.url}
            alt={character.displayName || character.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <span className="text-5xl font-bold text-gray-600">
              {(character.displayName || character.name).charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Premium badge */}
        {character.isPremium && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md bg-amber-900/80 backdrop-blur-sm">
            <Crown size={12} className="text-yellow-400" />
            <span className="text-[10px] font-semibold text-yellow-300">
              PRO
            </span>
          </div>
        )}

        {/* Stats overlay at bottom */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/80">
            <MessageSquare size={12} />
            <span className="text-xs font-medium">
              {formatCount(character.conversationCount)}
            </span>
          </div>
          {character.avgRating != null && (
            <div className="flex items-center gap-1 text-white/80">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">
                {character.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white truncate">
          {character.displayName || character.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
          {character.description}
        </p>
      </div>
    </Link>
  );
}
