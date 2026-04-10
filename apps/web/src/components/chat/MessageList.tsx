'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] text-sm leading-relaxed ${
          isUser
            ? 'bg-purple-600 text-white rounded-2xl rounded-br-md px-4 py-2.5'
            : 'bg-gray-800 text-gray-200 rounded-2xl rounded-bl-md border border-gray-700/50 px-4 py-2.5'
        }`}
      >
        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Generated image */}
        {message.imageUrl && (
          <div className={message.content ? 'mt-2' : ''}>
            <a
              href={message.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={message.imageUrl}
                alt="Generated image"
                className="rounded-lg max-w-full max-h-64 object-contain"
              />
            </a>
          </div>
        )}

        {/* Generated audio */}
        {message.audioUrl && (
          <div className={message.content ? 'mt-2' : ''}>
            <audio
              controls
              src={message.audioUrl}
              className="max-w-full h-8"
              style={{ filter: 'invert(1) hue-rotate(180deg)' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
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
