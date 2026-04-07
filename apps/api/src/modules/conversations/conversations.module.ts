import { Module } from '@nestjs/common';
import { ConversationsGateway } from './conversations.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [ConversationsGateway],
})
export class ConversationsModule {}
