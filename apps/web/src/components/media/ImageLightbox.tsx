'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { GalleryItemData } from './GalleryItem';
import { AudioPlayer } from '@/components/chat/AudioPlayer';

// Also export a simpler interface for use from chat bubbles
export interface LightboxImageData {
  src: string;
  prompt?: string;
  date?: string;
}

interface ImageLightboxProps {
  item?: GalleryItemData;
  image?: LightboxImageData;
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

export function ImageLightbox({ item, image, onClose }: ImageLightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

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

  // Resolve data from either prop
  const isGalleryItem = !!item;
  const imageUrl = item?.resultUrl ?? image?.src ?? null;
  const isImage = item ? item.type === 'image' : true;
  const prompt = item?.prompt ?? image?.prompt ?? null;
  const dateStr = item?.createdAt ?? image?.date ?? null;
  const itemId = item?.id ?? 'img';

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ethereal-${itemId.slice(0, 8)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex w-full h-full"
        >
          {/* Top-right actions */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Download"
              >
                <Download size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Media area */}
          <div className="flex-1 flex items-center justify-center p-8 min-w-0">
            {isImage && imageUrl ? (
              <div className="relative max-w-full max-h-full">
                {/* Loading spinner */}
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2
                      size={32}
                      className="animate-spin text-gray-500"
                    />
                  </div>
                )}
                <motion.img
                  src={imageUrl}
                  alt={prompt || 'Generated image'}
                  onLoad={() => setImageLoaded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageLoaded ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : imageUrl && isGalleryItem ? (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-amber-900/30 flex items-center justify-center">
                    <Sparkles size={32} className="text-amber-400" />
                  </div>
                </div>
                <p className="text-center text-gray-300 text-sm mb-6">
                  Generated Voice
                </p>
                <AudioPlayer src={imageUrl} />
              </div>
            ) : null}
          </div>

          {/* Info sidebar */}
          <motion.div
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-80 bg-gray-950/90 backdrop-blur-md border-l border-gray-800 p-6 flex flex-col shrink-0 overflow-y-auto hidden lg:flex"
          >
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5">
              Details
            </h3>

            {/* Prompt */}
            {prompt && (
              <div className="mb-5">
                <p className="text-xs font-medium text-gray-500 mb-1.5">
                  Prompt
                </p>
                <p className="text-sm text-gray-300 leading-relaxed bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                  {prompt}
                </p>
              </div>
            )}

            {/* Type badge (gallery items only) */}
            {isGalleryItem && item && (
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
            )}

            {/* Date */}
            {dateStr && (
              <div className="mb-6">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Created
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar size={14} className="text-gray-500" />
                  {formatFullDate(dateStr)}
                </div>
              </div>
            )}

            {/* Download in sidebar too */}
            {imageUrl && (
              <div className="mt-auto pt-4 border-t border-gray-800">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
