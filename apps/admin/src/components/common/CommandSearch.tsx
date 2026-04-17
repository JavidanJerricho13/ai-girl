'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Users,
  User,
  Sparkles,
  ScrollText,
  Shield,
  CreditCard,
  Settings,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import apiClient from '@/lib/api-client';

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  type: 'page' | 'user' | 'character';
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
}

const PAGES: SearchItem[] = [
  { type: 'page', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={14} /> },
  { type: 'page', label: 'Characters', href: '/characters', icon: <Users size={14} /> },
  { type: 'page', label: 'Create Character', href: '/characters/new', icon: <Sparkles size={14} /> },
  { type: 'page', label: 'Character Studio', href: '/characters/studio', icon: <Sparkles size={14} /> },
  { type: 'page', label: 'Users', href: '/users', icon: <User size={14} /> },
  { type: 'page', label: 'Moderation', href: '/moderation', icon: <Shield size={14} /> },
  { type: 'page', label: 'Transactions', href: '/logs', icon: <CreditCard size={14} /> },
  { type: 'page', label: 'Audit Log', href: '/audit', icon: <ScrollText size={14} /> },
  { type: 'page', label: 'Packages', href: '/packages', icon: <FileText size={14} /> },
  { type: 'page', label: 'Settings', href: '/settings', icon: <Settings size={14} /> },
];

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [entityResults, setEntityResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      setQuery('');
      setEntityResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  // Search users and characters from API
  const searchEntities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setEntityResults([]);
      return;
    }

    setSearching(true);
    try {
      const [usersRes, charsRes] = await Promise.all([
        apiClient.get('/admin/users', { params: { search: q, limit: 5 } }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/admin/characters', { params: { search: q, limit: 5 } }).catch(() => ({ data: { data: [] } })),
      ]);

      const users: SearchItem[] = (usersRes.data?.data ?? []).map((u: any) => ({
        type: 'user' as const,
        label: u.username || u.email,
        sublabel: u.email,
        href: `/users/${u.id}`,
        icon: <User size={14} />,
      }));

      const chars: SearchItem[] = (charsRes.data?.data ?? []).map((c: any) => ({
        type: 'character' as const,
        label: c.displayName || c.name,
        sublabel: c.category?.join(', '),
        href: `/characters/${c.id}`,
        icon: <Sparkles size={14} />,
      }));

      setEntityResults([...users, ...chars]);
    } catch {
      setEntityResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEntities(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchEntities]);

  useKeyboardShortcuts([
    { key: 'Escape', handler: onClose },
  ]);

  if (!open) return null;

  const filteredPages = query.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : PAGES;

  const allResults = [...filteredPages, ...entityResults];

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIdx]) {
      e.preventDefault();
      handleSelect(allResults[selectedIdx].href);
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'page': return 'Page';
      case 'user': return 'User';
      case 'character': return 'Character';
      default: return '';
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'user': return 'text-indigo-400 bg-indigo-900/30';
      case 'character': return 'text-violet-400 bg-violet-900/30';
      default: return 'text-zinc-500 bg-zinc-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-zinc-800">
          <Search size={16} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, users, characters..."
            autoFocus
            className="flex-1 py-3 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
          />
          {searching && <Loader2 size={14} className="animate-spin text-zinc-500" />}
          <kbd className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-1.5">
          {allResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-500">
                {query.length < 2 ? 'Type to search users & characters' : 'No results found'}
              </p>
            </div>
          ) : (
            allResults.map((item, idx) => (
              <button
                key={`${item.type}-${item.href}`}
                onClick={() => handleSelect(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors text-sm ${
                  idx === selectedIdx
                    ? 'bg-indigo-900/30 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <span className="text-zinc-500 shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-[10px] text-zinc-600 truncate block">{item.sublabel}</span>
                  )}
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${typeColor(item.type)}`}>
                  {typeLabel(item.type)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          <span><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">↵</kbd> select</span>
          <span><kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
