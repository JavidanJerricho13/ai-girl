import { Compass, SearchX } from 'lucide-react';
import { CharacterCard, CharacterCardData } from './CharacterCard';

interface CharacterGridProps {
  characters: CharacterCardData[];
  searchQuery?: string;
}

export function CharacterGrid({ characters, searchQuery }: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {searchQuery ? (
          <>
            <SearchX size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No characters found for &ldquo;{searchQuery}&rdquo;
            </h3>
            <p className="text-sm text-gray-500">
              Try a different name or category.
            </p>
          </>
        ) : (
          <>
            <Compass size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              No characters found
            </h3>
            <p className="text-sm text-gray-500">
              Try selecting a different category.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}
