'use client';

const CATEGORIES = [
  'All',
  'Romance',
  'Friendship',
  'Mentor',
  'Anime',
  'Celebrity',
  'Game',
  'Movie',
] as const;

export type Category = (typeof CATEGORIES)[number];

interface CategoryChipsProps {
  selected: Category;
  onChange: (category: Category) => void;
}

export function CategoryChips({ selected, onChange }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => {
        const active = cat === selected;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              active
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-300'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
