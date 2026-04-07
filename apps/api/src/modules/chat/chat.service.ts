import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RAGService } from '../memory/services/rag.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CharactersService } from '../characters/characters.service';
import { ModelRouterService } from './services/model-router.service';

interface ProcessMessageParams {
  conversationId: string;
  userId: string;
  content: string;
}

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private modelRouter: ModelRouterService,
    private ragService: RAGService,
    private conversationsService: ConversationsService,
    private charactersService: CharactersService,
  ) {}

  async *processMessage(params: ProcessMessageParams) {
    const { conversationId, userId, content } = params;
    const startTime = Date.now();

    // 1. Get conversation and character details
    const conversation = await this.conversationsService.findOne(conversationId, userId);
    const character = conversation.character;

    // 2. Save user message to database
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        userId,
        role: 'user',
        content,
        language: conversation.language,
      },
    });

    // 3. Get RAG context (short-term + long-term memory)
    let context = '';
    try {
      context = await this.ragService.getContext(conversationId, content);
    } catch (error) {
      console.error('Error getting RAG context:', error);
      // Continue without context if RAG fails
    }

    // 4. Build system prompt with character personality and context
    const systemPrompt = this.buildSystemPrompt(character, context);

    // 5. Generate AI response with streaming
    let fullResponse = '';
    const responseChunks: string[] = [];

    try {
      for await (const chunk of this.modelRouter.generateResponse({
        prompt: content,
        systemPrompt,
      })) {
        fullResponse += chunk;
        responseChunks.push(chunk);
        yield chunk; // Stream to client
      }
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }

    // 6. Save assistant message to database
    const latencyMs = Date.now() - startTime;
    const modelUsed = await this.modelRouter.detectLanguage(content) === 'az' ? 'openai' : 'groq';

    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: fullResponse,
        language: conversation.language,
        modelUsed,
        latencyMs,
      },
    });

    // 7. Update conversation metadata
    await this.conversationsService.updateLastMessageTime(conversationId);

    // 8. Increment character message count
    await this.charactersService.incrementMessageCount(character.id);

    // 9. Auto-store memory if needed (after every 5 message pairs)
    try {
      await this.ragService.autoStoreMemory(conversationId);
    } catch (error) {
      console.error('Error auto-storing memory:', error);
      // Don't fail the request if memory storage fails
    }
  }

  private buildSystemPrompt(character: any, context: string): string {
    let prompt = character.systemPrompt || 'You are a friendly and helpful AI assistant.';

    // Add personality traits
    if (character.shynessBold !== 50) {
      const trait = character.shynessBold > 50 ? 'bold and confident' : 'shy and reserved';
      prompt += `\nYou are ${trait} in your interactions.`;
    }

    if (character.romanticPragmatic !== 50) {
      const trait = character.romanticPragmatic > 50 ? 'romantic and idealistic' : 'pragmatic and realistic';
      prompt += `\nYou have a ${trait} outlook.`;
    }

    if (character.playfulSerious !== 50) {
      const trait = character.playfulSerious > 50 ? 'playful and humorous' : 'serious and thoughtful';
      prompt += `\nYour tone is ${trait}.`;
    }

    // Add context from RAG
    if (context) {
      prompt += `\n\nContext from previous conversations:\n${context}`;
    }

    return prompt;
  }
}
