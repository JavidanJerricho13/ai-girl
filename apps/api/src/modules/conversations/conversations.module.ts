import { Module, forwardRef } from '@nestjs/common';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { VideoStateService } from './services/video-state.service';
import { ChatModule } from '../chat/chat.module';
import { CharactersModule } from '../characters/characters.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [forwardRef(() => ChatModule), CharactersModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsGateway,
    ConversationsService,
    VideoStateService,
    PrismaService,
  ],
  exports: [ConversationsService, VideoStateService],
})
export class ConversationsModule {}
