'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationList } from '@/components/chat/ConversationList';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';
import { MessageSquare } from 'lucide-react';

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

export default function ChatPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [activeCharacter, setActiveCharacter] =
    useState<ActiveCharacter | null>(null);
  const currentAssistantMessage = useRef('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

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

  const handleNewConversation = useCallback(async () => {
    try {
      const res = await apiClient.get('/characters');
      const characters = res.data?.data ?? res.data ?? [];
      if (!characters.length) {
        alert('No characters available.');
        return;
      }

      const char = characters[0];
      const convRes = await apiClient.post('/conversations', {
        characterId: char.id,
      });

      const newConv = convRes.data;
      const avatarUrl = char.media?.find(
        (m: any) => m.type === 'profile',
      )?.url;

      setSelectedConversationId(newConv.id);
      setActiveCharacter({
        id: char.id,
        name: char.name,
        displayName: char.displayName || char.name,
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
  }, [socket, queryClient]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!socket || !isConnected || !selectedConversationId || !user) return;

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
    [socket, isConnected, selectedConversationId, user],
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
        onNewConversation={handleNewConversation}
        selectedConversationId={selectedConversationId || undefined}
      />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onMediaGenerated={handleMediaGenerated}
            disabled={!isConnected || isTyping}
            character={activeCharacter}
          />
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
              <p className="text-sm text-gray-600">
                Or start a new chat to begin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
