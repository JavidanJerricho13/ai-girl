'use client';

import { Search, X } from 'lucide-react';

interface CharacterFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  visibility: string;
  onVisibilityChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

const CATEGORIES = [
  'romance',
  'friendship',
  'mentor',
  'adventure',
  'fantasy',
  'roleplay',
  'educational',
  'comedy',
  'horror',
];

export function CharacterFilterBar({
  search,
  onSearchChange,
  visibility,
  onVisibilityChange,
  category,
  onCategoryChange,
}: CharacterFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or description..."
          className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Visibility */}
      <select
        value={visibility}
        onChange={(e) => onVisibilityChange(e.target.value)}
        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors appearance-none cursor-pointer"
      >
        <option value="">All Visibility</option>
        <option value="true">Public</option>
        <option value="false">Private</option>
      </select>

      {/* Category */}
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors appearance-none cursor-pointer capitalize"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat} className="capitalize">
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
