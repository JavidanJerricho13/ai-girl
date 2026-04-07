import { create } from 'zustand';
import { Message } from '../services/websocket.service';

interface ChatState {
  messages: Record<string, Message[]>;
  currentStreamingMessage: string;
  isTyping: boolean;

  // Actions
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  appendStreamChunk: (chunk: string) => void;
  finishStream: (conversationId: string, message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  currentStreamingMessage: '',
  isTyping: false,

  addMessage: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          message,
        ],
      },
    }));
  },

  setMessages: (conversationId, messages) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    }));
  },

  appendStreamChunk: (chunk) => {
    set((state) => ({
      currentStreamingMessage: state.currentStreamingMessage + chunk,
    }));
  },

  finishStream: (conversationId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [
          ...(state.messages[conversationId] || []),
          message,
        ],
      },
      currentStreamingMessage: '',
    }));
  },

  setTyping: (isTyping) => {
    set({ isTyping });
  },

  clearMessages: (conversationId) => {
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[conversationId];
      return { messages: newMessages };
    });
  },
}));
