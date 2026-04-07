'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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
      
      // Update the last message (assistant's response) with accumulated content
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

  const handleSendMessage = (content: string) => {
    if (!socket || !isConnected) {
      console.error('Socket not connected');
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
    socket.emit('send-message', { content });
  };

  return (
    <ChatWindow
      messages={messages}
      isTyping={isTyping}
      onSendMessage={handleSendMessage}
      disabled={!isConnected || isTyping}
    />
  );
}
