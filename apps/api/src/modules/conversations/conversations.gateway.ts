import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from '../chat/chat.service';
import { VideoStateService } from './services/video-state.service';
import { createWsAuthMiddleware } from './ws-auth.middleware';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3002',
    ],
    credentials: true,
  },
})
export class ConversationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private videoStateService: VideoStateService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    // Registers handshake auth on every connection. See ws-auth.middleware.ts
    // for why we accept both Bearer (mobile) and cookie (web) tokens and why
    // unauthenticated sockets are still allowed through.
    server.use(createWsAuthMiddleware(this.jwtService, this.configService));
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId?: string; content: string },
  ) {
    try {
      // Prefer the authenticated userId from the handshake token. Legacy
      // clients (older mobile builds, tests) still pass it in the body.
      const userId = client.data.userId || data.userId;

      if (!data.conversationId || !userId || !data.content) {
        client.emit('message-error', {
          error: 'Missing required fields: conversationId, userId, or content',
        });
        return;
      }

      client.join(data.conversationId);

      const room = this.server.to(data.conversationId);
      for await (const event of this.chatService.processMessage({
        conversationId: data.conversationId,
        userId,
        content: data.content,
      })) {
        switch (event.kind) {
          case 'typing':
            room.emit('message-typing', { durationMs: event.durationMs });
            break;
          case 'text':
            room.emit('message-chunk', { chunk: event.chunk });
            break;
          case 'media':
            room.emit('message-media', {
              mediaType: event.mediaType,
              url: event.url,
              caption: event.caption,
              messageId: event.messageId,
              isLocked: event.isLocked,
            });
            break;
          case 'credits':
            client.emit('credits-updated', {
              balance: event.balance,
              delta: event.delta,
            });
            break;
          case 'part-complete':
            // Mid-turn break for double-text. Web handler flushes the
            // current bubble and starts a new one; mobile ignores this
            // event, which means mobile renders one merged bubble live
            // (and two separate rows on conversation reload).
            room.emit('message-part-complete', {
              messageId: event.messageId,
            });
            break;
          case 'complete':
            room.emit('message-complete');
            break;
        }
      }
    } catch (error: any) {
      client.emit('message-error', { error: error?.message ?? 'Unknown chat error' });
    }
  }

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(data.conversationId);
    client.emit('joined-conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(data.conversationId);
    client.emit('left-conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('video-state-change')
  handleVideoStateChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; state: string },
  ) {
    const stateData = this.videoStateService.getState(data.conversationId);
    this.server.to(data.conversationId).emit('video-state-update', stateData);
  }

  /**
   * Emit video state change to all clients in a conversation
   */
  emitVideoStateChange(conversationId: string, stateData: any) {
    this.server.to(conversationId).emit('video-state-update', stateData);
  }

  /**
   * Push a character-initiated message to every device the user has
   * connected. The handshake middleware auto-joined them to
   * `user:${userId}`; if they're offline, nothing listens and we rely on
   * the (mock) push notification + message row already persisted in DB.
   */
  emitProactiveMessage(
    userId: string,
    payload: {
      conversationId: string;
      characterId: string;
      messageId: string;
      content: string;
      createdAt: string;
    },
  ) {
    this.server.to(`user:${userId}`).emit('proactive-message', payload);
  }
}
