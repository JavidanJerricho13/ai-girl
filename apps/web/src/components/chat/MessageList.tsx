'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { InlineImage } from './InlineImage';
import { AudioPlayer } from './AudioPlayer';
import {
  ImageLightbox,
  LightboxImageData,
} from '@/components/media/ImageLightbox';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
}

const COST_BADGE_DURATION_MS = 1200;

function CostBadge({ cost }: { cost: number }) {
  // Fire-and-forget: shows briefly on mount then fades away. Keeps the
  // economy visible without cluttering the thread permanently.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), COST_BADGE_DURATION_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {visible ? (
        <motion.span
          initial={{ opacity: 0, y: 4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/40 text-purple-200 text-[10px] font-medium leading-none"
          aria-label={`Cost: ${cost} credit${cost === 1 ? '' : 's'}`}
        >
          <Zap size={9} className="text-purple-300" />−{cost}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

function MessageBubble({
  message,
  onImageClick,
  showCost,
}: {
  message: Message;
  onImageClick: (data: LightboxImageData) => void;
  showCost: boolean;
}) {
  const isUser = message.role === 'user';
  const hasText = !!message.content;
  const hasImage = !!message.imageUrl;
  const hasAudio = !!message.audioUrl;
  const hasMedia = hasImage || hasAudio;
  const mediaOnly = hasMedia && !hasText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Cost badge sits outside the bubble, to the left of user messages,
          where it reads as metadata rather than content. */}
      {isUser && showCost ? <CostBadge cost={1} /> : null}

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
        {hasImage && (
          <div className={hasText ? 'mb-2' : ''}>
            <InlineImage
              src={message.imageUrl!}
              onClick={() =>
                onImageClick({
                  src: message.imageUrl!,
                  prompt: message.content || undefined,
                })
              }
            />
          </div>
        )}

        {hasText && (
          <p
            className={`whitespace-pre-wrap break-words ${
              hasImage ? 'px-2.5 pb-1' : ''
            }`}
          >
            {message.content}
          </p>
        )}

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
  const [lightboxImage, setLightboxImage] =
    useState<LightboxImageData | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show the cost badge only on the *most recent* user message, so scrolling
  // back through history doesn't flash a pulse of badges at the user.
  const lastUserId = [...messages].reverse().find((m) => m.role === 'user')?.id;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageClick={setLightboxImage}
            showCost={message.role === 'user' && message.id === lastUserId}
          />
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

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
