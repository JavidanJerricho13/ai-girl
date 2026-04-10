'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ImageIcon, Mic, X } from 'lucide-react';

interface AttachmentMenuProps {
  onSelectImage: () => void;
  onSelectVoice: () => void;
  userCredits: number;
}

export function AttachmentMenu({
  onSelectImage,
  onSelectVoice,
  userCredits,
}: AttachmentMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`p-2.5 rounded-xl transition-colors shrink-0 ${
          open
            ? 'bg-gray-700 text-white'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
        }`}
        aria-label="Attachments"
      >
        {open ? <X size={18} /> : <Plus size={18} />}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSelectImage();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-900/40 flex items-center justify-center">
              <ImageIcon size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">
                Generate Image
              </p>
              <p className="text-xs text-gray-500">10 credits</p>
            </div>
            {userCredits < 10 && (
              <span className="text-[10px] text-red-400 font-medium">
                Low
              </span>
            )}
          </button>

          <div className="border-t border-gray-700/50" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSelectVoice();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-900/40 flex items-center justify-center">
              <Mic size={16} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-200">
                Generate Voice
              </p>
              <p className="text-xs text-gray-500">3 credits</p>
            </div>
            {userCredits < 3 && (
              <span className="text-[10px] text-red-400 font-medium">
                Low
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
