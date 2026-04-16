import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ConversationsGateway } from './conversations.gateway';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { VideoStateService } from './services/video-state.service';
import { ChatModule } from '../chat/chat.module';
import { CharactersModule } from '../characters/characters.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  // AuthModule re-exports JwtModule + JwtStrategy so the gateway's handshake
  // middleware can verify tokens against the same secret as the HTTP guards.
  imports: [
    ConfigModule,
    AuthModule,
    forwardRef(() => ChatModule),
    CharactersModule,
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsGateway,
    ConversationsService,
    VideoStateService,
    PrismaService,
  ],
  exports: [ConversationsService, VideoStateService, ConversationsGateway],
})
export class ConversationsModule {}
