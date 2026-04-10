import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Video,
  Star,
  Users,
  Crown,
} from 'lucide-react';

interface CharacterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      {/* Back link */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Discover
      </Link>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-8">
        {/* Left: Hero image placeholder */}
        <div>
          <div className="aspect-[3/4] bg-gray-800 border border-gray-700/50 rounded-xl animate-pulse" />

          {/* Gallery strip placeholder */}
          <div className="flex gap-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 bg-gray-800 border border-gray-700/50 rounded-lg animate-pulse shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Right: Character info */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-white">
              Character {id.slice(0, 8)}
            </h1>
            <Crown size={20} className="text-yellow-500" />
          </div>

          <p className="text-gray-400 mb-6">
            Character description will appear here once data is loaded from the
            API.
          </p>

          {/* Categories */}
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30">
              Romance
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30">
              Anime
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-6 text-sm text-gray-500">
            <span>#placeholder</span>
            <span>#character</span>
            <span>#tags</span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
              <Users size={18} className="text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">—</p>
              <p className="text-xs text-gray-500">Conversations</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
              <MessageSquare size={18} className="text-gray-400 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">—</p>
              <p className="text-xs text-gray-500">Messages</p>
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
              <Star size={18} className="text-yellow-500 mx-auto mb-1" />
              <p className="text-lg font-semibold text-white">—</p>
              <p className="text-xs text-gray-500">Avg Rating</p>
            </div>
          </div>

          {/* Personality sliders placeholder */}
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Personality
          </h3>
          <div className="space-y-3 mb-8">
            {[
              ['Shy', 'Bold'],
              ['Romantic', 'Pragmatic'],
              ['Playful', 'Serious'],
              ['Dominant', 'Submissive'],
            ].map(([left, right]) => (
              <div key={left} className="flex items-center gap-3 text-xs">
                <span className="w-20 text-right text-gray-500">{left}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-purple-600 rounded-full" />
                </div>
                <span className="w-20 text-gray-500">{right}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg opacity-60 cursor-not-allowed"
            >
              <MessageSquare size={18} />
              Start Chat
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-700 opacity-60 cursor-not-allowed"
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
