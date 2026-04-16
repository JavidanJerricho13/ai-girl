import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RAGService } from '../memory/services/rag.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CharactersService } from '../characters/characters.service';
import {
  ModelRouterService,
  buildPersonalityBlock,
  computeChunkDelayMs,
  computeThinkingDelayMs,
} from './services/model-router.service';
import { CreditsService } from '../credits/credits.service';
import { ChatMediaService } from './services/chat-media.service';
import type { ToolDefinition } from '../../integrations/groq/groq.service';

interface ProcessMessageParams {
  conversationId: string;
  userId: string;
  content: string;
}

const CHAT_MESSAGE_COST = 1;

// Event shape yielded by processMessage. The websocket gateway and the
// REST preview endpoint both consume this stream; keep it small and
// stable — UI code depends on these kinds.
export type ChatEvent =
  | { kind: 'typing'; durationMs: number }
  | { kind: 'text'; chunk: string }
  | { kind: 'media'; mediaType: 'image'; url: string; caption?: string }
  | { kind: 'credits'; balance: number; delta: number }
  | { kind: 'complete' };

// LLM tool schema. Keep descriptions user-facing-friendly — the model reads
// them to decide *when* to call the tool.
const SEND_PHOTO_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'send_photo',
    description:
      "Send the user a photo of yourself. Use this when they ask to see you, ask for a picture or selfie, or when sharing a visual feels like the natural next beat of the conversation (e.g. you're describing where you are right now). Do NOT use it every turn — only when it genuinely fits.",
    parameters: {
      type: 'object',
      properties: {
        mood: {
          type: 'string',
          description:
            'One emotional word: playful | sultry | cozy | dreamy | mischievous | tender | focused',
        },
        scene: {
          type: 'string',
          description:
            'Short visual description of what the photo shows — lighting, setting, pose, outfit. One sentence.',
        },
        caption: {
          type: 'string',
          description:
            'Optional short text message to send along with the photo. Keep it under 80 characters and in character.',
        },
      },
      required: ['mood', 'scene'],
    },
  },
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

// Break a string into human-paced chunks so the client's streaming UI looks
// like real typing. We split on spaces so we don't bisect words mid-character.
function chunkForTyping(text: string): string[] {
  if (!text) return [];
  const parts: string[] = [];
  const tokens = text.split(/(\s+)/);
  let buf = '';
  for (const token of tokens) {
    buf += token;
    // Flush on word boundaries, roughly every 1–2 words, with an occasional
    // multi-word clump so the rhythm isn't perfectly metronomic.
    if (buf.length >= 6 || /[.?!…,]$/.test(token)) {
      parts.push(buf);
      buf = '';
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private modelRouter: ModelRouterService,
    private ragService: RAGService,
    private conversationsService: ConversationsService,
    private charactersService: CharactersService,
    private creditsService: CreditsService,
    private chatMediaService: ChatMediaService,
  ) {}

  /**
   * Stream chat events for a single user turn. Yields:
   *   typing → text (repeated) → (optional) media → complete
   * The gateway maps each kind to a websocket event; the REST preview
   * endpoint collects them into a single response payload.
   */
  async *processMessage(params: ProcessMessageParams): AsyncGenerator<ChatEvent> {
    const { conversationId, userId, content } = params;
    const startTime = Date.now();

    // 1. Credits first — fail fast before we pay the LLM latency tax.
    let balanceAfterDeduction: number;
    try {
      const result = await this.creditsService.deductCredits({
        userId,
        amount: CHAT_MESSAGE_COST,
        description: 'Chat message',
        metadata: { conversationId, action: 'chat_message' },
      });
      balanceAfterDeduction = result.newBalance;
    } catch (error: any) {
      throw new BadRequestException(
        error.message || 'Insufficient credits for chat message',
      );
    }

    // Surface the new balance immediately so the header badge flashes in
    // sync with the user's message bubble, before the LLM round-trip.
    yield {
      kind: 'credits',
      balance: balanceAfterDeduction,
      delta: -CHAT_MESSAGE_COST,
    };

    // 2. Pull conversation + character (now includes active LoRA).
    const conversation = await this.conversationsService.findOne(conversationId, userId);
    const character: any = conversation.character;

    // 3. Record the user's message first so RAG can see it.
    await this.prisma.message.create({
      data: {
        conversationId,
        userId,
        role: 'user',
        content,
        language: conversation.language,
      },
    });

    // 4. Build system prompt with character systemPrompt + personality + RAG context.
    let context = '';
    try {
      context = await this.ragService.getContext(conversationId, content);
    } catch (err) {
      this.logger.warn(`RAG context failed, continuing without: ${(err as Error).message}`);
    }
    const systemPrompt = this.buildSystemPrompt(character, context);

    // 5. Typing jitter — delay before the first token lands so the response
    //    feels written, not flashed. Also surfaces a 'typing' event so the
    //    UI can display the indicator at a natural pace.
    const thinkingMs = computeThinkingDelayMs(content.length);
    yield { kind: 'typing', durationMs: thinkingMs };
    await sleep(thinkingMs);

    // 6. One non-streaming LLM call with the send_photo tool available.
    const llm = await this.modelRouter.generateWithTools({
      prompt: content,
      systemPrompt,
      tools: [SEND_PHOTO_TOOL],
    });

    // 7. If the model wants a photo, kick off image generation in parallel
    //    so the text can stream while the image is rendering (images take
    //    several seconds; we'd rather not block the text on them).
    const photoArgs = extractPhotoArgs(llm.toolCalls);
    const photoPromise = photoArgs
      ? this.chatMediaService
          .generateForChat({
            userId,
            characterId: character.id,
            scene: photoArgs.scene,
            mood: photoArgs.mood,
            nsfwAllowed: Boolean(conversation.nsfwEnabled),
          })
          .catch((err) => {
            this.logger.error(`send_photo failed: ${err?.message}`);
            return null;
          })
      : null;

    // 8. Emit the assistant's text as fake-streaming chunks. When the model
    //    only produced a tool call and no content, fall back to the tool's
    //    caption so the user isn't left staring at an empty bubble.
    const textBody = (llm.content || photoArgs?.caption || '').trim();
    const chunks = chunkForTyping(textBody);
    let assembled = '';
    for (const chunk of chunks) {
      assembled += chunk;
      yield { kind: 'text', chunk };
      await sleep(computeChunkDelayMs());
    }

    // 9. Wait for the photo if one was requested and emit it after the text.
    let imageUrl: string | null = null;
    if (photoPromise) {
      const result = await photoPromise;
      if (result) {
        imageUrl = result.url;
        yield {
          kind: 'media',
          mediaType: 'image',
          url: result.url,
          caption: photoArgs?.caption,
        };
      }
    }

    // 10. Persist the assistant message with (optional) imageUrl. We save
    //     once — text and image share a single Message row so the /conversations
    //     re-fetch renders the same shape as the live stream.
    const language = (await this.modelRouter.detectLanguage(content)) === 'az' ? 'openai' : 'groq';
    const latencyMs = Date.now() - startTime;
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assembled,
        language: conversation.language,
        modelUsed: language,
        latencyMs,
        imageUrl: imageUrl ?? undefined,
      },
    });

    // 11. Housekeeping: conversation timestamp, character counters, memory summarization.
    await this.conversationsService.updateLastMessageTime(conversationId);
    await this.charactersService.incrementMessageCount(character.id);
    try {
      await this.ragService.autoStoreMemory(conversationId);
    } catch (err) {
      this.logger.warn(`autoStoreMemory failed: ${(err as Error).message}`);
    }

    yield { kind: 'complete' };
  }

  private buildSystemPrompt(character: any, context: string): string {
    const parts: string[] = [];
    parts.push(character.systemPrompt || 'You are a friendly and helpful AI companion.');

    const personality = buildPersonalityBlock({
      warmth: character.warmth,
      playfulness: character.playfulness,
    });
    if (personality) parts.push(personality);

    if (context) {
      parts.push(`Things you remember about this person:\n${context}`);
    }

    // A lightweight behavioural guardrail — keeps short, conversational tone
    // (this is an emotional companion, not a knowledge assistant) and nudges
    // the model to use the send_photo tool sparingly rather than every turn.
    parts.push(
      [
        'Write like a text conversation: short, warm, natural. No bulleted lists, no headings.',
        'You have a tool called send_photo. Use it only when the user asks to see you or when a visual clearly belongs in the moment. Most replies should be text only.',
      ].join(' '),
    );

    return parts.join('\n\n');
  }
}

function extractPhotoArgs(
  toolCalls: { name: string; arguments: Record<string, any> }[],
): { mood?: string; scene: string; caption?: string } | null {
  const call = toolCalls.find((t) => t.name === 'send_photo');
  if (!call) return null;
  const scene = typeof call.arguments.scene === 'string' ? call.arguments.scene : '';
  if (!scene) return null;
  return {
    mood: typeof call.arguments.mood === 'string' ? call.arguments.mood : undefined,
    scene,
    caption: typeof call.arguments.caption === 'string' ? call.arguments.caption : undefined,
  };
}
