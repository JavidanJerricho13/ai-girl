'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Loader2, Compass } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface CharacterOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isPremium: boolean;
  media: Array<{ url: string; type: string }>;
}

interface CharacterPickerModalProps {
  onSelect: (character: CharacterOption) => void;
  onClose: () => void;
}

const DEBOUNCE_MS = 250;

export function CharacterPickerModal({
  onSelect,
  onClose,
}: CharacterPickerModalProps) {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const { data: characters, isLoading } = useQuery<CharacterOption[]>({
    queryKey: ['characters-picker', debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | boolean | number> = {
        isPublic: true,
        limit: 50,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await apiClient.get('/characters', { params });
      return res.data?.data ?? res.data ?? [];
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h3 className="text-base font-semibold text-white">
            Choose a Character
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-800 shrink-0">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Character list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-500" />
            </div>
          ) : !characters || characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Compass size={36} className="text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 mb-1">
                {debouncedSearch
                  ? `No characters found for "${debouncedSearch}"`
                  : 'No characters available'}
              </p>
              <p className="text-xs text-gray-600">
                {debouncedSearch
                  ? 'Try a different search term.'
                  : 'Check back later.'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {characters.map((char) => {
                const avatarUrl = char.media?.find(
                  (m) => m.type === 'profile',
                )?.url;
                const name = char.displayName || char.name;

                return (
                  <button
                    key={char.id}
                    onClick={() => onSelect(char)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-800/60 transition-colors group"
                  >
                    {/* Avatar */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                          {name}
                        </span>
                        {char.isPremium && (
                          <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-1.5 py-0.5 rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {char.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <span className="text-gray-600 group-hover:text-gray-400 text-sm shrink-0">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
