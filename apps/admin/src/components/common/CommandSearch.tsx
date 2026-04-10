'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, FileText, Loader2 } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: 'page';
  label: string;
  href: string;
  icon: React.ReactNode;
}

const PAGES: SearchResult[] = [
  { type: 'page', label: 'Dashboard', href: '/dashboard', icon: <FileText size={14} /> },
  { type: 'page', label: 'Characters', href: '/characters', icon: <Users size={14} /> },
  { type: 'page', label: 'Create Character', href: '/characters/new', icon: <FileText size={14} /> },
  { type: 'page', label: 'Users', href: '/users', icon: <Users size={14} /> },
  { type: 'page', label: 'Moderation', href: '/moderation', icon: <FileText size={14} /> },
  { type: 'page', label: 'Transactions', href: '/logs', icon: <FileText size={14} /> },
  { type: 'page', label: 'Packages', href: '/packages', icon: <FileText size={14} /> },
  { type: 'page', label: 'Settings', href: '/settings', icon: <FileText size={14} /> },
];

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useKeyboardShortcuts([
    { key: 'Escape', handler: onClose },
  ]);

  if (!open) return null;

  const filtered = query.trim()
    ? PAGES.filter((p) =>
        p.label.toLowerCase().includes(query.toLowerCase()),
      )
    : PAGES;

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-zinc-800">
          <Search size={16} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            autoFocus
            className="flex-1 py-3 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
          />
          <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-500">No results found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.href}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                <span className="text-zinc-500">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
