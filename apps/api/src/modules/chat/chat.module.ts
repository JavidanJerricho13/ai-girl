import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ModelRouterService } from './services/model-router.service';
import { GroqService } from '../../integrations/groq/groq.service';
import { OpenAIService } from '../../integrations/openai/openai.service';
import { PrismaService } from '../../common/services/prisma.service';
import { MemoryModule } from '../memory/memory.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { CharactersModule } from '../characters/characters.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    ConfigModule,
    MemoryModule,
    forwardRef(() => ConversationsModule),
    CharactersModule,
    CreditsModule,
  ],
  providers: [
    ChatService,
    ModelRouterService,
    GroqService,
    OpenAIService,
    PrismaService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
