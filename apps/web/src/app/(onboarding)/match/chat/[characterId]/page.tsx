import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { GuestChat } from '@/components/chat/GuestChat';

/**
 * Guest chat with a matchmaker-selected character. Fetches the character
 * on the server so we can fail fast (404) if the id is stale or the
 * character was deprived of isPublic; after that it's the same /auth/guest
 * + /chat/preview flow the landing page uses.
 *
 * Fallback accent: matchmaker characters from the DB don't carry the
 * brand-lilac triplets that LANDING_CHARACTERS do. We use neutral plum
 * tones so the UI still feels branded even before we wire real accents.
 */

interface ApiCharacter {
  id: string;
  name: string;
  displayName: string;
  description: string;
  media?: Array<{ url: string; type: string }>;
}

async function fetchCharacter(id: string): Promise<ApiCharacter | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${base}/api/characters/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ApiCharacter;
  } catch {
    return null;
  }
}

export default async function MatchChatPage({
  params,
}: {
  params: { characterId: string };
}) {
  const character = await fetchCharacter(params.characterId);
  if (!character) notFound();

  const portrait =
    character.media?.find((m) => m.type === 'profile')?.url ||
    '/landing/characters/02-warm.webp';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <div className="mb-8">
        <Link
          href="/match"
          className="inline-flex items-center gap-1 text-sm text-whisper/60 transition-colors hover:text-whisper"
        >
          <ChevronLeft size={16} />
          Different match
        </Link>
      </div>

      <div className="flex-1">
        <GuestChat
          character={{
            id: character.id,
            displayName: character.displayName,
            portrait,
            accent: {
              glow: '186 120 255', // plum — shared brand accent for match-spawned chats
              edge: '105 65 170',
            },
          }}
          heading={character.displayName}
          eyebrow="You two seem to click"
        />
      </div>
    </div>
  );
}
