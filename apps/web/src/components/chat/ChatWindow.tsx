'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { GenerationModal } from './GenerationModal';
import { LowCreditsBanner } from './LowCreditsBanner';
import { CreditBadge } from '@/components/credits/CreditBadge';
import { useAuthStore } from '@/store/auth.store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  isLocked?: boolean;
}

interface ActiveCharacter {
  id: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
}

type GenerationType = 'image' | 'voice';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  onMediaGenerated?: (result: {
    type: GenerationType;
    url?: string;
    jobId?: string;
  }) => void;
  onMediaUnlocked?: (messageId: string, payload: { imageUrl?: string; audioUrl?: string }) => void;
  disabled?: boolean;
  character?: ActiveCharacter | null;
  connectionState?: ConnectionState;
}

// Threshold for the "running low" warning. Matches the backend chat cost
// (1 credit/message) — at 3 credits the user has ~3 messages left before
// they hit the paywall, which is the right moment to nudge.
const LOW_CREDITS_THRESHOLD = 3;

export function ChatWindow({
  messages,
  isTyping,
  onSendMessage,
  onMediaGenerated,
  onMediaUnlocked,
  disabled,
  character,
  connectionState = 'connected',
}: ChatWindowProps) {
  const { user, updateUser } = useAuthStore();
  const [generationModal, setGenerationModal] = useState<GenerationType | null>(
    null,
  );

  const name = character
    ? character.displayName || character.name
    : 'AI Assistant';

  const credits = user?.credits ?? 0;
  const showLowWarning = credits > 0 && credits < LOW_CREDITS_THRESHOLD;
  const outOfCredits = credits <= 0;

  const handleGenerated = (result: {
    type: GenerationType;
    url?: string;
    jobId?: string;
  }) => {
    // Optimistic local deduction — the websocket credits-updated event
    // will still override this with the authoritative balance once the
    // backend processes the media request.
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
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                connectionState === 'connected' ? 'bg-emerald-400' :
                connectionState === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
                connectionState === 'offline' ? 'bg-red-400' :
                'bg-gray-400 animate-pulse'
              }`} />
              <p className={`text-xs ${
                connectionState === 'connected' ? 'text-emerald-400' :
                connectionState === 'reconnecting' ? 'text-amber-400' :
                connectionState === 'offline' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {connectionState === 'connected' ? 'Online' :
                 connectionState === 'reconnecting' ? 'Reconnecting' :
                 connectionState === 'offline' ? 'Offline' : 'Connecting'}
              </p>
            </div>
          </div>
        </div>
        {/* Credit balance is present in the top nav already; duplicating it
            here keeps it eye-level with the chat action, not tucked in the
            corner — matches how messaging apps show your balance mid-flow. */}
        <div className="flex items-center gap-3">
          <CreditBadge credits={credits} />
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
      </div>

      {(showLowWarning || outOfCredits) && (
        <LowCreditsBanner credits={credits} />
      )}

      <MessageList
        messages={messages}
        isTyping={isTyping}
        onMediaUnlocked={onMediaUnlocked}
      />

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
