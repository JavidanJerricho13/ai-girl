'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { MessageSquare, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  characterId: string;
  title: string | null;
  updatedAt: string;
  character: {
    name: string;
    avatarUrl: string | null;
  };
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  selectedConversationId?: string;
}

export function ConversationList({
  onSelectConversation,
  onNewConversation,
  selectedConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await apiClient.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare className="mx-auto mb-2" size={32} />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedConversationId === conv.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {conv.character.avatarUrl ? (
                    <img
                      src={conv.character.avatarUrl}
                      alt={conv.character.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
                      {conv.character.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.character.name}</p>
                    <p className="text-xs opacity-70 truncate">
                      {conv.title || 'New conversation'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
