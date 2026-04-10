'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-purple-600 text-white rounded-2xl rounded-br-md'
                : 'bg-gray-800 text-gray-200 rounded-2xl rounded-bl-md border border-gray-700/50'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </motion.div>
      ))}

      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <TypingIndicator />
        </motion.div>
      )}

      <div ref={endRef} />
    </div>
  );
}
