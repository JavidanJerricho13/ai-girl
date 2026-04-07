import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConversationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string },
  ) {
    try {
      // Stream response
      for await (const chunk of this.chatService.processMessage(data)) {
        client.emit('message-chunk', { chunk });
      }

      client.emit('message-complete');
    } catch (error) {
      client.emit('message-error', { error: error.message });
    }
  }
}
