'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CharacterForm } from '@/components/characters/CharacterForm';

export default function NewCharacterPage() {
  return (
    <div>
      <Link
        href="/characters"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Characters
      </Link>

      <h2 className="text-xl font-semibold text-white mb-6">
        Create Character
      </h2>

      <CharacterForm mode="create" />
    </div>
  );
}
