import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ModelRouterService } from './services/model-router.service';
import { GroqService } from '../../integrations/groq/groq.service';
import { OpenAIService } from '../../integrations/openai/openai.service';

@Module({
  imports: [ConfigModule],
  providers: [ChatService, ModelRouterService, GroqService, OpenAIService],
  exports: [ChatService],
})
export class ChatModule {}
