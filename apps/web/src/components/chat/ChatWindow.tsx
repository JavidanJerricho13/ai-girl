'use client';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatWindow({ messages, isTyping, onSendMessage, disabled }: ChatWindowProps) {
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <p className="text-sm opacity-90">Powered by Groq & OpenAI</p>
      </div>
      
      <MessageList messages={messages} isTyping={isTyping} />
      <MessageInput onSend={onSendMessage} disabled={disabled} />
    </div>
  );
}
