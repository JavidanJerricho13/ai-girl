import { Injectable } from '@nestjs/common';
import { GroqService } from '../../../integrations/groq/groq.service';
import { OpenAIService } from '../../../integrations/openai/openai.service';

@Injectable()
export class ModelRouterService {
  constructor(
    private groqService: GroqService,
    private openAIService: OpenAIService,
  ) {}

  async detectLanguage(text: string): Promise<'en' | 'az'> {
    // Detect Azerbaijani by checking for specific characters
    const azCharacters = /[əöüğışçӘÖÜĞIŞÇ]/;
    return azCharacters.test(text) ? 'az' : 'en';
  }

  async *generateResponse(params: {
    prompt: string;
    systemPrompt: string;
  }) {
    const language = await this.detectLanguage(params.prompt);

    if (language === 'az') {
      // Use GPT-4o-mini for Azerbaijani
      yield* this.openAIService.streamResponse({
        systemPrompt: params.systemPrompt,
        userMessage: params.prompt,
      });
    } else {
      // Use Groq for English
      yield* this.groqService.streamResponse({
        systemPrompt: params.systemPrompt,
        userMessage: params.prompt,
      });
    }
  }
}
