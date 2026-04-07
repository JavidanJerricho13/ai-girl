import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { VideoStateService } from './services/video-state.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConversationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private videoStateService: VideoStateService,
  ) {}

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string; content: string },
  ) {
    try {
      // Validate required fields
      if (!data.conversationId || !data.userId || !data.content) {
        client.emit('message-error', {
          error: 'Missing required fields: conversationId, userId, or content'
        });
        return;
      }

      // Join conversation room
      client.join(data.conversationId);

      // Stream response
      for await (const chunk of this.chatService.processMessage({
        conversationId: data.conversationId,
        userId: data.userId,
        content: data.content,
      })) {
        // Emit to the specific conversation room
        this.server.to(data.conversationId).emit('message-chunk', { chunk });
      }

      this.server.to(data.conversationId).emit('message-complete');
    } catch (error) {
      client.emit('message-error', { error: error.message });
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
}
