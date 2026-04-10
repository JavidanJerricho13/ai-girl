import { Users, MessageSquare, Star } from 'lucide-react';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

interface StatCardsProps {
  conversationCount: number;
  messageCount: number;
  avgRating: number | null;
}

export function StatCards({
  conversationCount,
  messageCount,
  avgRating,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
        <Users size={18} className="text-blue-400 mx-auto mb-1.5" />
        <p className="text-lg font-semibold text-white">
          {formatCount(conversationCount)}
        </p>
        <p className="text-xs text-gray-500">Chats</p>
      </div>
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
        <MessageSquare size={18} className="text-emerald-400 mx-auto mb-1.5" />
        <p className="text-lg font-semibold text-white">
          {formatCount(messageCount)}
        </p>
        <p className="text-xs text-gray-500">Messages</p>
      </div>
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 text-center">
        <Star
          size={18}
          className={
            avgRating != null
              ? 'text-yellow-400 fill-yellow-400 mx-auto mb-1.5'
              : 'text-gray-500 mx-auto mb-1.5'
          }
        />
        <p className="text-lg font-semibold text-white">
          {avgRating != null ? avgRating.toFixed(1) : '—'}
        </p>
        <p className="text-xs text-gray-500">Rating</p>
      </div>
    </div>
  );
}
