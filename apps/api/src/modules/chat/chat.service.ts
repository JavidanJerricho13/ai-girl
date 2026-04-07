import { Injectable } from '@nestjs/common';
import { ModelRouterService } from './services/model-router.service';

@Injectable()
export class ChatService {
  constructor(private modelRouter: ModelRouterService) {}

  async *processMessage(data: { content: string }) {
    const systemPrompt = 'You are a friendly and helpful AI assistant.';
    
    yield* this.modelRouter.generateResponse({
      prompt: data.content,
      systemPrompt,
    });
  }
}
