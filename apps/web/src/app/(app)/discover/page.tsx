import { Compass, Search } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Romance',
  'Friendship',
  'Mentor',
  'Anime',
  'Celebrity',
  'Game',
  'Movie',
  'Original',
];

export default function DiscoverPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Compass className="text-purple-400" size={28} />
          <h2 className="text-2xl font-semibold text-white">
            Discover Characters
          </h2>
        </div>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search characters..."
            disabled
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 placeholder-gray-500 w-64 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-default ${
              cat === 'All'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Placeholder Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden"
          >
            <div className="aspect-[3/4] bg-gray-800 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-700/60 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
