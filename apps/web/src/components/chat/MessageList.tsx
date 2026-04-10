'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TypingIndicator } from './TypingIndicator';
import { InlineImage } from './InlineImage';
import { AudioPlayer } from './AudioPlayer';

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
  const hasText = !!message.content;
  const hasImage = !!message.imageUrl;
  const hasAudio = !!message.audioUrl;
  const hasMedia = hasImage || hasAudio;

  // Media-only messages get different padding
  const mediaOnly = hasMedia && !hasText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[75%] text-sm leading-relaxed overflow-hidden ${
          isUser
            ? `bg-purple-600 text-white rounded-2xl rounded-br-md ${
                mediaOnly ? 'p-1.5' : 'px-4 py-2.5'
              }`
            : `bg-gray-800 text-gray-200 rounded-2xl rounded-bl-md border border-gray-700/50 ${
                mediaOnly ? 'p-1.5' : 'px-4 py-2.5'
              }`
        }`}
      >
        {/* Image */}
        {hasImage && (
          <div className={hasText ? 'mb-2' : ''}>
            <InlineImage src={message.imageUrl!} />
          </div>
        )}

        {/* Text */}
        {hasText && (
          <p
            className={`whitespace-pre-wrap break-words ${
              mediaOnly ? '' : ''
            } ${hasImage ? 'px-2.5 pb-1' : ''}`}
          >
            {message.content}
          </p>
        )}

        {/* Audio */}
        {hasAudio && (
          <div className={hasText ? 'mt-2' : 'p-1.5'}>
            <AudioPlayer src={message.audioUrl!} />
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
