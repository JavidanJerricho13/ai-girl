'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationList } from '@/components/chat/ConversationList';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const currentAssistantMessage = useRef('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('message-chunk', (data: { chunk: string }) => {
      currentAssistantMessage.current += data.chunk;

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];

        if (lastMessage && lastMessage.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
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
      console.error('Message error:', data.error);
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

  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);

    try {
      const response = await apiClient.get(`/conversations/${conversationId}`);
      const conversation = response.data;

      const formattedMessages = conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }));

      setMessages(formattedMessages);

      if (socket) {
        socket.emit('join-conversation', { conversationId });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const charactersResponse = await apiClient.get('/characters');
      const characters = charactersResponse.data;

      if (!characters || characters.length === 0) {
        console.error('No characters available');
        alert('No characters available. Please contact support.');
        return;
      }

      const defaultCharacter = characters[0];

      const response = await apiClient.post('/conversations', {
        characterId: defaultCharacter.id,
      });

      const newConversation = response.data;
      setSelectedConversationId(newConversation.id);
      setMessages([]);

      if (socket) {
        socket.emit('join-conversation', { conversationId: newConversation.id });
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to create conversation. Please try again.');
    }
  };

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected || !selectedConversationId || !user) {
      console.error('Cannot send message: missing requirements');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMessage]);

    currentAssistantMessage.current = '';
    setIsTyping(true);

    socket.emit('send-message', {
      conversationId: selectedConversationId,
      userId: user.id,
      content,
    });
  };

  return (
    <div className="flex h-full -m-4 md:-m-6">
      <ConversationList
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        selectedConversationId={selectedConversationId || undefined}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversationId ? (
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            disabled={!isConnected || isTyping}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-xl mb-2">Select a conversation or start a new one</p>
              <p className="text-sm">Your AI companion is waiting to chat with you</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
