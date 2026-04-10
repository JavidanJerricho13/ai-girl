'use client';

import { useEffect } from 'react';
import { X, Download, Calendar, Sparkles } from 'lucide-react';
import { GalleryItemData } from './GalleryItem';
import { AudioPlayer } from '@/components/chat/AudioPlayer';

interface ImageLightboxProps {
  item: GalleryItemData;
  onClose: () => void;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ImageLightbox({ item, onClose }: ImageLightboxProps) {
  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const isImage = item.type === 'image';

  const handleDownload = () => {
    if (!item.resultUrl) return;
    const a = document.createElement('a');
    a.href = item.resultUrl;
    a.download = `ethereal-${item.type}-${item.id.slice(0, 8)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative flex w-full h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Media area */}
        <div className="flex-1 flex items-center justify-center p-8 min-w-0">
          {isImage && item.resultUrl ? (
            <img
              src={item.resultUrl}
              alt={item.prompt || 'Generated image'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : item.resultUrl ? (
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-900/30 flex items-center justify-center">
                  <Sparkles size={32} className="text-amber-400" />
                </div>
              </div>
              <p className="text-center text-gray-300 text-sm mb-6">
                Generated Voice
              </p>
              <AudioPlayer src={item.resultUrl} />
            </div>
          ) : null}
        </div>

        {/* Info sidebar */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 flex flex-col shrink-0 overflow-y-auto hidden lg:flex">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Details
          </h3>

          {/* Prompt */}
          {item.prompt && (
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-1.5">
                Prompt
              </p>
              <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                {item.prompt}
              </p>
            </div>
          )}

          {/* Type */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Type</p>
            <span
              className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                isImage
                  ? 'bg-emerald-900/30 text-emerald-400'
                  : 'bg-amber-900/30 text-amber-400'
              }`}
            >
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </span>
          </div>

          {/* Date */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Calendar size={14} className="text-gray-500" />
              {formatFullDate(item.createdAt)}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-4 border-t border-gray-800">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
