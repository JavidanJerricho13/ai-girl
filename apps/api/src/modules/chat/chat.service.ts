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
  | {
      kind: 'media';
      mediaType: 'image' | 'voice';
      url: string;
      caption?: string;
      messageId: string;
      isLocked: boolean;
    }
  | { kind: 'credits'; balance: number; delta: number }
  | { kind: 'complete' };

// LLM tool schema. Unified photo/voice interface — the model picks the
// appropriate medium for the moment. Tool description coaches the model
// to be sparing: most turns should be text-only.
const REQUEST_MEDIA_TOOL: ToolDefinition = {
  type: 'function',
  function: {
    name: 'request_media',
    description:
      "Share a photo or voice note with the user. Use sparingly — only when they explicitly ask, when sharing a visual/audio is the natural next beat of the conversation, or when a moment genuinely calls for it. Most replies should be text only. Pick 'photo' for visual moments and 'voice' when warmth/intimacy of tone matters more than image.",
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['photo', 'voice'],
          description: "'photo' = a picture of yourself; 'voice' = a short audio note.",
        },
        description: {
          type: 'string',
          description:
            "For photo: short visual description (lighting, setting, pose, outfit) in one sentence. For voice: the exact script to speak aloud, max 40 words — written the way she actually talks, not formal.",
        },
        caption: {
          type: 'string',
          description:
            'Optional short text to send alongside the media. Under 80 characters, in character.',
        },
      },
      required: ['type', 'description'],
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

    // 6. One non-streaming LLM call with the request_media tool available.
    const llm = await this.modelRouter.generateWithTools({
      prompt: content,
      systemPrompt,
      tools: [REQUEST_MEDIA_TOOL],
    });

    // 7. Parse the tool call (if any) and kick off generation in parallel so
    //    the text can stream while the media is rendering. Only the first
    //    request_media call is honoured — stacking media per turn is noise.
    const mediaArgs = extractMediaArgs(llm.toolCalls);
    const isPremium = await this.isUserPremium(userId);

    const mediaPromise = mediaArgs
      ? this.runMediaTool({
          type: mediaArgs.type,
          description: mediaArgs.description,
          userId,
          characterId: character.id,
          nsfwAllowed: Boolean(conversation.nsfwEnabled),
          language: conversation.language as 'en' | 'az',
        }).catch((err) => {
          this.logger.error(`request_media failed: ${err?.message}`);
          return null;
        })
      : null;

    // 8. Emit the assistant's text as fake-streaming chunks. When the model
    //    only produced a tool call and no content, fall back to the tool's
    //    caption so the user isn't left staring at an empty bubble.
    const textBody = (llm.content || mediaArgs?.caption || '').trim();
    const chunks = chunkForTyping(textBody);
    let assembled = '';
    for (const chunk of chunks) {
      assembled += chunk;
      yield { kind: 'text', chunk };
      await sleep(computeChunkDelayMs());
    }

    // 9. Persist the assistant message first, so the media event carries a
    //    real messageId the frontend can reference when calling the unlock
    //    endpoint. Media URLs are attached below once generation resolves.
    const modelUsed = (await this.modelRouter.detectLanguage(content)) === 'az' ? 'openai' : 'groq';
    const latencyMs = Date.now() - startTime;
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: assembled,
        language: conversation.language,
        modelUsed,
        latencyMs,
      },
    });

    // 10. Wait for the media (if requested), attach to the persisted message,
    //     and emit the media event with messageId + isLocked so the client
    //     can render the blurred-preview state for non-premium users.
    if (mediaPromise) {
      const result = await mediaPromise;
      if (result) {
        const isLocked = !isPremium;
        await this.prisma.message.update({
          where: { id: assistantMessage.id },
          data: {
            imageUrl: result.kind === 'image' ? result.url : undefined,
            audioUrl: result.kind === 'voice' ? result.url : undefined,
            ...({ isLocked } as any),
          },
        });
        yield {
          kind: 'media',
          mediaType: result.kind === 'image' ? 'image' : 'voice',
          url: result.url,
          caption: mediaArgs?.caption,
          messageId: assistantMessage.id,
          isLocked,
        };
      }
    }

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
    // the model to use request_media sparingly rather than every turn.
    parts.push(
      [
        'Write like a text conversation: short, warm, natural. No bulleted lists, no headings.',
        'You have a tool called request_media. Call it only when the user asks to see or hear you, or when a visual/voice clearly belongs in the moment. Most replies should be text only.',
      ].join(' '),
    );

    return parts.join('\n\n');
  }

  private async isUserPremium(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    });
    if (!user?.isPremium) return false;
    if (user.premiumUntil && user.premiumUntil < new Date()) return false;
    return true;
  }

  private async runMediaTool(params: {
    type: 'photo' | 'voice';
    description: string;
    userId: string;
    characterId: string;
    nsfwAllowed: boolean;
    language: 'en' | 'az';
  }): Promise<{ kind: 'image' | 'voice'; url: string } | null> {
    if (params.type === 'photo') {
      const result = await this.chatMediaService.generateForChat({
        userId: params.userId,
        characterId: params.characterId,
        scene: params.description,
        nsfwAllowed: params.nsfwAllowed,
      });
      return { kind: 'image', url: result.url };
    }

    // voice
    const result = await this.chatMediaService.generateVoiceForChat({
      userId: params.userId,
      characterId: params.characterId,
      script: params.description,
      language: params.language,
    });
    return { kind: 'voice', url: result.url };
  }
}

function extractMediaArgs(
  toolCalls: { name: string; arguments: Record<string, any> }[],
): { type: 'photo' | 'voice'; description: string; caption?: string } | null {
  const call = toolCalls.find((t) => t.name === 'request_media');
  if (!call) return null;
  const type = call.arguments.type === 'voice' ? 'voice' : 'photo';
  const description =
    typeof call.arguments.description === 'string' ? call.arguments.description : '';
  if (!description) return null;
  return {
    type,
    description,
    caption: typeof call.arguments.caption === 'string' ? call.arguments.caption : undefined,
  };
}
