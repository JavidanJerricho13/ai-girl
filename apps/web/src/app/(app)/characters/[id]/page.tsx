'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Video,
  Crown,
  Loader2,
  Lock,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';
import { CharacterHero } from '@/components/character/CharacterHero';
import {
  PersonalitySliders,
  PersonalityValues,
} from '@/components/character/PersonalitySliders';
import { StatCards } from '@/components/character/StatCards';

// ── Types ────────────────────────────────────────────────

interface CharacterMedia {
  id: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
}

interface Character {
  id: string;
  name: string;
  displayName: string;
  description: string;
  shynessBold: number;
  romanticPragmatic: number;
  playfulSerious: number;
  dominantSubmissive: number;
  isPremium: boolean;
  isOfficial: boolean;
  category: string[];
  tags: string[];
  conversationCount: number;
  messageCount: number;
  avgRating: number | null;
  media: CharacterMedia[];
  creator: { id: string; username: string | null };
}

// ── Skeleton ─────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div>
      <div className="h-5 w-32 bg-gray-800 rounded animate-pulse mb-6" />
      <div className="grid lg:grid-cols-[360px_1fr] gap-8">
        <div>
          <div className="aspect-[3/4] bg-gray-800 rounded-xl animate-pulse" />
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-16 bg-gray-800 rounded-lg animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-800 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-gray-800/60 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-800/60 rounded w-4/5 animate-pulse" />
          <div className="h-4 bg-gray-800/60 rounded w-3/5 animate-pulse" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 w-20 bg-gray-800 rounded-full animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-800/60 rounded-lg animate-pulse"
              />
            ))}
          </div>
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-4 bg-gray-800 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CharacterDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isStarting, setIsStarting] = useState(false);

  const {
    data: character,
    isLoading,
    isError,
    refetch,
  } = useQuery<Character>({
    queryKey: ['character', id],
    queryFn: async () => {
      const res = await apiClient.get(`/characters/${id}`);
      return res.data;
    },
  });

  const handleStartChat = async () => {
    if (!character || isStarting) return;
    setIsStarting(true);
    try {
      // Check for existing conversation
      const convRes = await apiClient.get('/conversations');
      const conversations: any[] = convRes.data ?? [];
      const existing = conversations.find(
        (c: any) => c.characterId === character.id || c.character?.id === character.id,
      );

      if (existing) {
        router.push(`/chat`);
      } else {
        await apiClient.post('/conversations', {
          characterId: character.id,
        });
        router.push(`/chat`);
      }
    } catch {
      alert('Could not start a conversation. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !character) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Failed to load character
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          The character could not be found or an error occurred.
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const personality: PersonalityValues = {
    shynessBold: character.shynessBold,
    romanticPragmatic: character.romanticPragmatic,
    playfulSerious: character.playfulSerious,
    dominantSubmissive: character.dominantSubmissive,
  };

  const needsUpgrade = character.isPremium && !user?.isPremium;

  return (
    <div>
      {/* Back */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Discover
      </Link>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-8">
        {/* Left: Hero */}
        <CharacterHero
          name={character.displayName || character.name}
          media={character.media}
        />

        {/* Right: Info */}
        <div>
          {/* Name + badges */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold text-white">
              {character.displayName || character.name}
            </h1>
            {character.isPremium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-900/60 text-yellow-300 text-xs font-semibold">
                <Crown size={12} />
                Premium
              </span>
            )}
            {character.isOfficial && (
              <span className="px-2.5 py-1 rounded-md bg-blue-900/40 text-blue-300 text-xs font-semibold">
                Official
              </span>
            )}
          </div>

          {/* Creator */}
          {character.creator?.username && (
            <p className="text-sm text-gray-500 mb-4">
              by @{character.creator.username}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-400 leading-relaxed mb-5">
            {character.description}
          </p>

          {/* Categories */}
          {character.category.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {character.category.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30 capitalize"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {character.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6 text-sm text-gray-500">
              {character.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mb-6">
            <StatCards
              conversationCount={character.conversationCount}
              messageCount={character.messageCount}
              avgRating={character.avgRating}
            />
          </div>

          {/* Personality */}
          <div className="mb-8">
            <PersonalitySliders values={personality} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {needsUpgrade ? (
              <Link
                href="/credits"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                <Lock size={18} />
                Upgrade to Chat
              </Link>
            ) : (
              <button
                onClick={handleStartChat}
                disabled={isStarting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageSquare size={18} />
                )}
                {isStarting ? 'Starting...' : 'Start Chat'}
              </button>
            )}
            <button
              onClick={() =>
                alert('Video calls coming soon!')
              }
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <Video size={18} />
              Video Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
