'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { ChatWindow, type ConnectionState } from '@/components/chat/ChatWindow';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ConversationList } from '@/components/chat/ConversationList';
import { CharacterPickerModal } from '@/components/chat/CharacterPickerModal';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';
import { MessageSquare, Plus } from 'lucide-react';

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

export default function ChatPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [activeCharacter, setActiveCharacter] =
    useState<ActiveCharacter | null>(null);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const currentAssistantMessage = useRef('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => setConnectionState('connected'));
    newSocket.on('disconnect', () => setConnectionState('reconnecting'));
    newSocket.io.on('reconnect_failed' as any, () => setConnectionState('offline'));
    newSocket.io.on('reconnect_attempt' as any, () => setConnectionState('reconnecting'));

    // Server-driven "she's thinking" indicator. We already flip isTyping to
    // true optimistically on send; this event is mostly informative (and
    // lets us keep the indicator alive if the thinking delay is longer
    // than expected).
    newSocket.on('message-typing', () => {
      setIsTyping(true);
    });

    newSocket.on('message-chunk', (data: { chunk: string }) => {
      currentAssistantMessage.current += data.chunk;

      setMessages((prev) => {
        const newMessages = [...prev];
        const last = newMessages[newMessages.length - 1];

        if (last && last.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...last,
            content: currentAssistantMessage.current,
          };
        } else {
          newMessages.push({
            id: Date.now().toString(),
            role: 'assistant',
            content: currentAssistantMessage.current,
          });
        }
        return newMessages;
      });
    });

    // Tool-call result from request_media — patch the current assistant
    // message with the generated URL + locked state so the gate renders
    // for free-tier users and premium users get it straight away. Falls
    // through to a fresh bubble if the assistant hasn't emitted any text.
    newSocket.on(
      'message-media',
      (data: {
        mediaType: 'image' | 'voice';
        url: string;
        caption?: string;
        messageId: string;
        isLocked: boolean;
      }) => {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          const last = newMessages[lastIndex];
          const patch: Partial<Message> =
            data.mediaType === 'image'
              ? { imageUrl: data.url, isLocked: data.isLocked, id: data.messageId }
              : { audioUrl: data.url, isLocked: data.isLocked, id: data.messageId };

          if (last && last.role === 'assistant') {
            newMessages[lastIndex] = { ...last, ...patch };
            return newMessages;
          }
          return [
            ...newMessages,
            {
              id: data.messageId,
              role: 'assistant',
              content: data.caption ?? '',
              isLocked: data.isLocked,
              imageUrl: data.mediaType === 'image' ? data.url : undefined,
              audioUrl: data.mediaType === 'voice' ? data.url : undefined,
            },
          ];
        });
      },
    );

    // Authoritative balance from the server, emitted the moment the API
    // debits the chat message. Overwrites the optimistic local state so the
    // badge stays in sync even if the user has multiple tabs open.
    newSocket.on(
      'credits-updated',
      (data: { balance: number; delta: number }) => {
        updateUser({ credits: data.balance });
        // Invalidate any React Query caches that surface credits (e.g. the
        // /profile page) so they refetch with the fresh number.
        queryClient.invalidateQueries({ queryKey: ['credits'] });
      },
    );

    // Double-text mid-turn signal. Freeze the current assistant bubble so
    // the next chunks start a fresh one — but keep isTyping true so the
    // indicator stays up during the 2s pause between parts.
    newSocket.on('message-part-complete', () => {
      currentAssistantMessage.current = '';
    });

    newSocket.on('message-complete', () => {
      setIsTyping(false);
      currentAssistantMessage.current = '';
    });

    newSocket.on('message-error', (data: { error: string }) => {
      setIsTyping(false);
      currentAssistantMessage.current = '';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
        },
      ]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSelectConversation = useCallback(
    async (
      conversationId: string,
      character: {
        id: string;
        name: string;
        displayName: string;
        media: Array<{ url: string; type: string }>;
      },
    ) => {
      setSelectedConversationId(conversationId);
      const avatarUrl = character.media?.find(
        (m) => m.type === 'profile',
      )?.url;
      setActiveCharacter({
        id: character.id,
        name: character.name,
        displayName: character.displayName,
        avatarUrl,
      });

      try {
        const response = await apiClient.get(
          `/conversations/${conversationId}`,
        );
        const conversation = response.data;
        setMessages(
          conversation.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            imageUrl: msg.imageUrl ?? undefined,
            audioUrl: msg.audioUrl ?? undefined,
            isLocked: Boolean(msg.isLocked),
          })),
        );

        if (socket) {
          socket.emit('join-conversation', { conversationId });
        }
      } catch {
        console.error('Failed to load conversation');
      }
    },
    [socket],
  );

  const handleOpenCharacterPicker = useCallback(() => {
    setShowCharacterPicker(true);
  }, []);

  const handleCharacterSelected = useCallback(
    async (character: {
      id: string;
      name: string;
      displayName: string;
      media: Array<{ url: string; type: string }>;
    }) => {
      setShowCharacterPicker(false);
      try {
        const convRes = await apiClient.post('/conversations', {
          characterId: character.id,
        });

        const newConv = convRes.data;
        const avatarUrl = character.media?.find(
          (m) => m.type === 'profile',
        )?.url;

        setSelectedConversationId(newConv.id);
        setActiveCharacter({
          id: character.id,
          name: character.name,
          displayName: character.displayName || character.name,
          avatarUrl,
        });
        setMessages([]);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });

        if (socket) {
          socket.emit('join-conversation', { conversationId: newConv.id });
        }
      } catch {
        alert('Failed to create conversation.');
      }
    },
    [socket, queryClient],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!socket || connectionState !== 'connected' || !selectedConversationId || !user) return;

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content },
      ]);

      currentAssistantMessage.current = '';
      setIsTyping(true);

      socket.emit('send-message', {
        conversationId: selectedConversationId,
        userId: user.id,
        content,
      });
    },
    [socket, connectionState, selectedConversationId, user],
  );

  const handleMediaUnlocked = useCallback(
    (messageId: string, payload: { imageUrl?: string; audioUrl?: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isLocked: false,
                imageUrl: payload.imageUrl ?? m.imageUrl,
                audioUrl: payload.audioUrl ?? m.audioUrl,
              }
            : m,
        ),
      );
    },
    [],
  );

  const handleMediaGenerated = useCallback(
    (result: { type: 'image' | 'voice'; url?: string; jobId?: string }) => {
      const msg: Message = {
        id: `gen-${Date.now()}`,
        role: 'assistant',
        content: result.type === 'image' ? '🖼️ Generated image' : '🔊 Generated audio',
        imageUrl: result.type === 'image' ? result.url : undefined,
        audioUrl: result.type === 'voice' ? result.url : undefined,
      };
      setMessages((prev) => [...prev, msg]);
    },
    [],
  );

  return (
    <div className="flex h-full -m-4 md:-m-6 bg-gray-900">
      {/* Conversation sidebar */}
      <ConversationList
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleOpenCharacterPicker}
        selectedConversationId={selectedConversationId || undefined}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <ErrorBoundary>
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onSendMessage={handleSendMessage}
              onMediaGenerated={handleMediaGenerated}
              onMediaUnlocked={handleMediaUnlocked}
              disabled={connectionState !== 'connected' || isTyping}
              character={activeCharacter}
              connectionState={connectionState}
            />
          </ErrorBoundary>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <MessageSquare
                size={48}
                className="text-gray-700 mx-auto mb-4"
              />
              <p className="text-lg text-gray-400 mb-1">
                Select a conversation
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Or start a new chat to begin
              </p>
              <button
                onClick={handleOpenCharacterPicker}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={18} />
                New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Character picker modal */}
      {showCharacterPicker && (
        <CharacterPickerModal
          onSelect={handleCharacterSelected}
          onClose={() => setShowCharacterPicker(false)}
        />
      )}
    </div>
  );
}
