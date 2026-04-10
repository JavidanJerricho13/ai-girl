import { ImageIcon } from 'lucide-react';

export default function GalleryPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="text-purple-400" size={28} />
        <h2 className="text-2xl font-semibold text-white">My Gallery</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/40 rounded-lg p-1 w-fit">
        {['All', 'Images', 'Voice'].map((tab) => (
          <span
            key={tab}
            className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-default ${
              tab === 'All'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400'
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Placeholder grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-800/50 border border-gray-700/50 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Empty state (visible when no items) */}
      <div className="text-center text-gray-500 mt-12 hidden first:block">
        <ImageIcon size={48} className="mx-auto mb-3 text-gray-600" />
        <p className="text-lg text-gray-300 mb-1">No media yet</p>
        <p className="text-sm">
          Generate images or voice in chat to see them here.
        </p>
      </div>
    </div>
  );
}
