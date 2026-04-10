'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { CharacterForm } from '@/components/characters/CharacterForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCharacterPage({ params }: PageProps) {
  const { id } = use(params);

  const { data: character, isLoading, isError } = useQuery({
    queryKey: ['admin-character', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/characters/${id}`);
      return res.data;
    },
  });

  return (
    <div>
      <Link
        href={`/characters/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Detail
      </Link>

      <h2 className="text-xl font-semibold text-white mb-6">
        Edit Character
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-500" />
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-sm text-zinc-400 mb-3">
            Failed to load character
          </p>
          <Link
            href="/characters"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Back to list
          </Link>
        </div>
      ) : (
        <CharacterForm mode="edit" characterId={id} initialData={character} />
      )}
    </div>
  );
}
