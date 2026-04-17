'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { AttachmentMenu } from './AttachmentMenu';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  userCredits: number;
  onSelectImage: () => void;
  onSelectVoice: () => void;
}

export function MessageInput({
  onSend,
  disabled,
  userCredits,
  onSelectImage,
  onSelectVoice,
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-gray-800 bg-gray-950/60 p-3"
    >
      <div className="flex items-end gap-2">
        <AttachmentMenu
          onSelectImage={onSelectImage}
          onSelectVoice={onSelectVoice}
          userCredits={userCredits}
        />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          aria-label="Message input"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-gray-800 text-gray-200 placeholder-gray-500 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
}
