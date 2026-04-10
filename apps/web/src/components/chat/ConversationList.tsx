'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';

interface ConversationCharacter {
  id: string;
  name: string;
  displayName: string;
  media: Array<{ url: string; type: string }>;
}

interface Conversation {
  id: string;
  characterId: string;
  lastMessageAt: string | null;
  messageCount: number;
  character: ConversationCharacter;
  messages: Array<{ content: string; role: string; createdAt: string }>;
}

interface ConversationListProps {
  onSelectConversation: (id: string, character: ConversationCharacter) => void;
  onNewConversation: () => void;
  selectedConversationId?: string;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function ConversationList({
  onSelectConversation,
  onNewConversation,
  selectedConversationId,
}: ConversationListProps) {
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await apiClient.get('/conversations');
      return res.data;
    },
  });

  return (
    <div className="w-72 lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 hidden md:flex">
      {/* New chat button */}
      <div className="p-3 border-b border-gray-800">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gray-500" />
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <MessageSquare size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => {
              const active = selectedConversationId === conv.id;
              const char = conv.character;
              const avatarUrl = char.media?.find(
                (m) => m.type === 'profile',
              )?.url;
              const name = char.displayName || char.name;
              const lastMsg = conv.messages?.[0];
              const preview = lastMsg
                ? lastMsg.role === 'user'
                  ? `You: ${lastMsg.content}`
                  : lastMsg.content
                : 'No messages yet';
              const time = formatTime(
                conv.lastMessageAt || lastMsg?.createdAt || null,
              );

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id, char)}
                  className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-purple-900/30 border-l-2 border-purple-500'
                      : 'hover:bg-gray-800/50 border-l-2 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-sm font-medium truncate ${
                          active ? 'text-purple-300' : 'text-gray-200'
                        }`}
                      >
                        {name}
                      </span>
                      {time && (
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          {time}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{preview}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
