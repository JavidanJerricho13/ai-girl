'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Zap } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';
import { InlineImage } from './InlineImage';
import { AudioPlayer } from './AudioPlayer';
import { MessageMediaGate } from './MessageMediaGate';
import { useAuthStore } from '@/store/auth.store';
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
  isLocked?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onMediaUnlocked?: (messageId: string, payload: { imageUrl?: string; audioUrl?: string }) => void;
}

const COST_BADGE_DURATION_MS = 1200;

function CostBadge({ cost }: { cost: number }) {
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

const MessageBubble = memo(function MessageBubble({
  message,
  onImageClick,
  showCost,
  onMediaUnlocked,
}: {
  message: Message;
  onImageClick: (data: LightboxImageData) => void;
  showCost: boolean;
  onMediaUnlocked?: (messageId: string, payload: { imageUrl?: string; audioUrl?: string }) => void;
}) {
  const isPremium = useAuthStore((s) => Boolean(s.user?.isPremium));
  const isUser = message.role === 'user';
  const hasText = !!message.content;
  const hasImage = !!message.imageUrl;
  const hasAudio = !!message.audioUrl;
  const hasMedia = hasImage || hasAudio;
  const showGate = !isPremium && !isUser && Boolean(message.isLocked) && hasMedia;
  const mediaOnly = hasMedia && !hasText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
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
        {showGate && (
          <div className={hasText ? 'mb-2' : ''}>
            <MessageMediaGate
              messageId={message.id}
              previewUrl={message.imageUrl || ''}
              mediaType={hasImage ? 'image' : 'voice'}
              onUnlocked={(payload) => onMediaUnlocked?.(message.id, payload)}
            />
          </div>
        )}

        {!showGate && hasImage && (
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

        {!showGate && hasAudio && (
          <div className={hasText ? 'mt-2' : 'p-1.5'}>
            <AudioPlayer src={message.audioUrl!} />
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => (
  prev.message.id === next.message.id &&
  prev.message.content === next.message.content &&
  prev.message.imageUrl === next.message.imageUrl &&
  prev.message.audioUrl === next.message.audioUrl &&
  prev.message.isLocked === next.message.isLocked &&
  prev.showCost === next.showCost
));

export function MessageList({ messages, isTyping, onMediaUnlocked }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] =
    useState<LightboxImageData | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setUserScrolledUp(!atBottom);
  }, []);

  // Auto-scroll only if user is at the bottom
  useEffect(() => {
    if (!userScrolledUp) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, userScrolledUp]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserScrolledUp(false);
  }, []);

  const lastUserId = [...messages].reverse().find((m) => m.role === 'user')?.id;

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3 relative"
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onImageClick={setLightboxImage}
            showCost={message.role === 'user' && message.id === lastUserId}
            onMediaUnlocked={onMediaUnlocked}
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

      {/* "New messages" jump-to-bottom button */}
      <AnimatePresence>
        {userScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 glass-accent rounded-full px-4 py-2 text-xs text-white shadow-lg"
          >
            <ChevronDown size={14} />
            New messages
          </motion.button>
        )}
      </AnimatePresence>

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
