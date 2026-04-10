'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { GenerationModal } from './GenerationModal';
import { useAuthStore } from '@/store/auth.store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface ActiveCharacter {
  id: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
}

type GenerationType = 'image' | 'voice';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onMediaGenerated?: (result: {
    type: GenerationType;
    url?: string;
    jobId?: string;
  }) => void;
  disabled?: boolean;
  character?: ActiveCharacter | null;
}

export function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  onMediaGenerated,
  disabled,
  character,
}: ChatWindowProps) {
  const { user, updateUser } = useAuthStore();
  const [generationModal, setGenerationModal] = useState<GenerationType | null>(
    null,
  );

  const name = character
    ? character.displayName || character.name
    : 'AI Assistant';

  const credits = user?.credits ?? 0;

  const handleGenerated = (result: {
    type: GenerationType;
    url?: string;
    jobId?: string;
  }) => {
    // Deduct credits optimistically
    const cost = result.type === 'image' ? 10 : 3;
    updateUser({ credits: Math.max(0, credits - cost) });
    onMediaGenerated?.(result);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat header */}
      <div className="h-14 shrink-0 border-b border-gray-800 px-4 flex items-center justify-between bg-gray-950/60">
        <div className="flex items-center gap-3">
          {character?.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-emerald-400">Online</p>
          </div>
        </div>
        {character && (
          <Link
            href={`/characters/${character.id}`}
            className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            title="Character info"
          >
            <Info size={18} />
          </Link>
        )}
      </div>

      <MessageList messages={messages} isTyping={isTyping} />

      <MessageInput
        onSend={onSendMessage}
        disabled={disabled}
        userCredits={credits}
        onSelectImage={() => setGenerationModal('image')}
        onSelectVoice={() => setGenerationModal('voice')}
      />

      {/* Generation modal */}
      {generationModal && character && (
        <GenerationModal
          type={generationModal}
          characterId={character.id}
          userCredits={credits}
          onClose={() => setGenerationModal(null)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
}
