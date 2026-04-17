import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = __DEV__ 
  ? 'http://localhost:3001' 
  : 'https://api.ethereal.app';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface VideoState {
  isInCall: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  emotion: string;
}

export interface MediaEvent {
  mediaType: 'image' | 'voice';
  url: string;
  caption?: string;
  messageId: string;
  isLocked: boolean;
}

export interface CreditsEvent {
  balance: number;
  delta: number;
}

export interface ProactiveEvent {
  conversationId: string;
  characterId: string;
  messageId: string;
  content: string;
  createdAt: string;
}

type MessageHandler = (message: Message) => void;
type MessageChunkHandler = (chunk: string) => void;
type VideoStateHandler = (state: VideoState) => void;
type TypingHandler = (isTyping: boolean) => void;
type MediaHandler = (data: MediaEvent) => void;
type CreditsHandler = (data: CreditsEvent) => void;
type ProactiveHandler = (data: ProactiveEvent) => void;
type PartCompleteHandler = (data: { messageId: string }) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private chunkHandlers: MessageChunkHandler[] = [];
  private videoStateHandlers: VideoStateHandler[] = [];
  private typingHandlers: TypingHandler[] = [];
  private mediaHandlers: MediaHandler[] = [];
  private creditsHandlers: CreditsHandler[] = [];
  private proactiveHandlers: ProactiveHandler[] = [];
  private partCompleteHandlers: PartCompleteHandler[] = [];
  private currentConversationId: string | null = null;

  async connect() {
    if (this.socket?.connected) {
      return;
    }

    const token = await AsyncStorage.getItem('accessToken');
    
    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      // Rejoin current conversation if any
      if (this.currentConversationId) {
        this.joinConversation(this.currentConversationId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('message-chunk', (data: { chunk: string }) => {
      this.chunkHandlers.forEach(handler => handler(data.chunk));
    });

    this.socket.on('message-complete', () => {
      this.chunkHandlers.forEach(handler => handler(''));
    });

    this.socket.on('typing', (data: { isTyping: boolean }) => {
      this.typingHandlers.forEach(handler => handler(data.isTyping));
    });

    this.socket.on('video-state', (state: VideoState) => {
      this.videoStateHandlers.forEach(handler => handler(state));
    });

    this.socket.on('credits-updated', (data: CreditsEvent) => {
      this.creditsHandlers.forEach(handler => handler(data));
    });

    this.socket.on('message-media', (data: MediaEvent) => {
      this.mediaHandlers.forEach(handler => handler(data));
    });

    this.socket.on('message-part-complete', (data: { messageId: string }) => {
      this.partCompleteHandlers.forEach(handler => handler(data));
    });

    this.socket.on('proactive-message', (data: ProactiveEvent) => {
      this.proactiveHandlers.forEach(handler => handler(data));
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  joinConversation(conversationId: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.currentConversationId = conversationId;
    this.socket.emit('join-conversation', { conversationId });
  }

  leaveConversation(conversationId: string) {
    if (!this.socket) return;
    this.socket.emit('leave-conversation', { conversationId });
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  // ============================================
  // MESSAGING
  // ============================================

  sendMessage(conversationId: string, content: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('send-message', { conversationId, content });
  }

  sendTyping(conversationId: string, isTyping: boolean) {
    if (!this.socket) return;
    this.socket.emit('typing', { conversationId, isTyping });
  }

  // ============================================
  // VIDEO CALLS
  // ============================================

  updateVideoState(conversationId: string, state: Partial<VideoState>) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.emit('video-state-change', { conversationId, ...state });
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onMessageChunk(handler: MessageChunkHandler) {
    this.chunkHandlers.push(handler);
    return () => {
      this.chunkHandlers = this.chunkHandlers.filter(h => h !== handler);
    };
  }

  onVideoState(handler: VideoStateHandler) {
    this.videoStateHandlers.push(handler);
    return () => {
      this.videoStateHandlers = this.videoStateHandlers.filter(h => h !== handler);
    };
  }

  onTyping(handler: TypingHandler) {
    this.typingHandlers.push(handler);
    return () => {
      this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
    };
  }

  onCreditsUpdated(handler: CreditsHandler) {
    this.creditsHandlers.push(handler);
    return () => {
      this.creditsHandlers = this.creditsHandlers.filter(h => h !== handler);
    };
  }

  onMedia(handler: MediaHandler) {
    this.mediaHandlers.push(handler);
    return () => {
      this.mediaHandlers = this.mediaHandlers.filter(h => h !== handler);
    };
  }

  onPartComplete(handler: PartCompleteHandler) {
    this.partCompleteHandlers.push(handler);
    return () => {
      this.partCompleteHandlers = this.partCompleteHandlers.filter(h => h !== handler);
    };
  }

  onProactiveMessage(handler: ProactiveHandler) {
    this.proactiveHandlers.push(handler);
    return () => {
      this.proactiveHandlers = this.proactiveHandlers.filter(h => h !== handler);
    };
  }

  // ============================================
  // STATE
  // ============================================

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }
}

export const websocketService = new WebSocketService();
