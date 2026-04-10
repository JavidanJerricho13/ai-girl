export function CharacterCardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
      <div className="aspect-[3/4] bg-gray-800 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-700/60 rounded w-full animate-pulse" />
        <div className="h-3 bg-gray-700/60 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

export function CharacterGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CharacterCardSkeleton key={i} />
      ))}
    </div>
  );
}
