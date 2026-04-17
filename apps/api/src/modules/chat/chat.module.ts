import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ModelRouterService } from './services/model-router.service';
import { ChatMediaService } from './services/chat-media.service';
import { PromptBuilderService } from '../characters/services/prompt-builder.service';
import { GroqService } from '../../integrations/groq/groq.service';
import { OpenAIService } from '../../integrations/openai/openai.service';
import { FalService } from '../../integrations/fal/fal.service';
import { ElevenLabsService } from '../../integrations/elevenlabs/elevenlabs.service';
import { AzureTtsService } from '../../integrations/azure-tts/azure-tts.service';
import { PrismaService } from '../../common/services/prisma.service';
import { StorageService } from '../../common/services/storage.service';
import { MemoryModule } from '../memory/memory.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { CharactersModule } from '../characters/characters.module';
import { CreditsModule } from '../credits/credits.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    ConfigModule,
    MemoryModule,
    ModerationModule,
    forwardRef(() => ConversationsModule),
    CharactersModule,
    CreditsModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ModelRouterService,
    ChatMediaService,
    PromptBuilderService,
    GroqService,
    OpenAIService,
    FalService,
    ElevenLabsService,
    AzureTtsService,
    StorageService,
    PrismaService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
