'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ConversationList } from '@/components/chat/ConversationList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/api-client';
import { LogOut } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function ChatPageContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const currentAssistantMessage = useRef('');

  useEffect(() => {
    // Connect to WebSocket server
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
      console.log('Message complete');
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
    
    // Fetch conversation messages
    try {
      const response = await apiClient.get(`/conversations/${conversationId}`);
      const conversation = response.data;
      
      // Transform messages for display
      const formattedMessages = conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }));
      
      setMessages(formattedMessages);
      
      // Join the conversation room
      if (socket) {
        socket.emit('join-conversation', { conversationId });
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    // For now, just create a new conversation with the first character
    // In a full implementation, you'd show a character selector
    try {
      const response = await apiClient.post('/conversations', {
        characterId: '1', // Default character - should be dynamic
      });
      
      const newConversation = response.data;
      setSelectedConversationId(newConversation.id);
      setMessages([]);
      
      if (socket) {
        socket.emit('join-conversation', { conversationId: newConversation.id });
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected || !selectedConversationId || !user) {
      console.error('Cannot send message: missing requirements');
      return;
    }

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Reset assistant message accumulator
    currentAssistantMessage.current = '';
    setIsTyping(true);

    // Send message to server
    socket.emit('send-message', {
      conversationId: selectedConversationId,
      userId: user.id,
      content,
    });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen">
      <ConversationList
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        selectedConversationId={selectedConversationId || undefined}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Ethereal AI</h1>
            {user && (
              <span className="text-sm text-gray-400">
                Welcome, {user.username}
              </span>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Chat Window */}
        <div className="flex-1">
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
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
