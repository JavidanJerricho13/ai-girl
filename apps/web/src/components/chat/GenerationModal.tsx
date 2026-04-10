'use client';

import { useState } from 'react';
import {
  X,
  ImageIcon,
  Mic,
  Loader2,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

type GenerationType = 'image' | 'voice';

interface ImageSize {
  label: string;
  value: string;
}

const IMAGE_SIZES: ImageSize[] = [
  { label: 'Square', value: 'square_hd' },
  { label: 'Portrait', value: 'portrait_4_3' },
  { label: 'Landscape', value: 'landscape_4_3' },
];

interface GenerationModalProps {
  type: GenerationType;
  characterId: string;
  userCredits: number;
  onClose: () => void;
  onGenerated: (result: {
    type: GenerationType;
    url?: string;
    jobId?: string;
  }) => void;
}

export function GenerationModal({
  type,
  characterId,
  userCredits,
  onClose,
  onGenerated,
}: GenerationModalProps) {
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState('square_hd');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = type === 'image' ? 10 : 3;
  const hasCredits = userCredits >= cost;
  const isImage = type === 'image';

  const handleGenerate = async () => {
    if (!prompt.trim() || !hasCredits || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      if (isImage) {
        const res = await apiClient.post('/media/generate/image', {
          prompt: prompt.trim(),
          characterId,
          imageSize,
        });
        onGenerated({
          type: 'image',
          url: res.data.imageUrl,
          jobId: res.data.jobId,
        });
      } else {
        const res = await apiClient.post('/media/generate/voice', {
          text: prompt.trim(),
          characterId,
        });
        onGenerated({
          type: 'voice',
          url: res.data.audioUrl,
          jobId: res.data.jobId,
        });
      }
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Generation failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isImage
                  ? 'bg-emerald-900/40'
                  : 'bg-amber-900/40'
              }`}
            >
              {isImage ? (
                <ImageIcon size={18} className="text-emerald-400" />
              ) : (
                <Mic size={18} className="text-amber-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isImage ? 'Generate Image' : 'Generate Voice'}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Coins size={12} />
                <span>{cost} credits</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Prompt input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {isImage ? 'Image prompt' : 'Text to speak'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isImage
                  ? 'Describe the image you want to generate...'
                  : 'Enter the text to convert to speech...'
              }
              rows={isImage ? 3 : 2}
              className="w-full resize-none bg-gray-800 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-colors"
              autoFocus
            />
          </div>

          {/* Image size selector */}
          {isImage && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Aspect ratio
              </label>
              <div className="flex gap-2">
                {IMAGE_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setImageSize(size.value)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      imageSize === size.value
                        ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Credit warning */}
          {!hasCredits && (
            <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg flex items-center justify-between">
              <p className="text-xs text-amber-400">
                You need {cost - userCredits} more credits
              </p>
              <Link
                href="/credits"
                className="text-xs font-medium text-purple-400 hover:text-purple-300"
              >
                Top up →
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || !hasCredits || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
