import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RAGService } from '../memory/services/rag.service';
import { ConversationsService } from '../conversations/conversations.service';
import { CharactersService } from '../characters/characters.service';
import { PromptBuilderService } from '../characters/services/prompt-builder.service';
import { ModerationService } from '../moderation/moderation.service';
import {
  ModelRouterService,
  computeChunkDelayMs,
  computeThinkingDelayMs,
  computeTypingDelayMs,
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
  | { kind: 'part-complete'; messageId: string }
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

// 10% chance to split a response into two "texts" with a 2s gap between
// them. Only fires when the response is long enough and has a clean split
// point (sentence end in the first 30%).
const DOUBLE_TEXT_CHANCE = 0.10;
const DOUBLE_TEXT_GAP_MS = 2000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function chunkForTyping(text: string): string[] {
  if (!text) return [];
  const parts: string[] = [];
  const tokens = text.split(/(\s+)/);
  let buf = '';
  for (const token of tokens) {
    buf += token;
    if (buf.length >= 6 || /[.?!…,]$/.test(token)) {
      parts.push(buf);
      buf = '';
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

/**
 * Maybe split a response into two parts for the "double-text" effect.
 * Returns [fullText] if no split, or [part1, part2] if split.
 */
function maybeSplitForDoubleText(text: string): string[] {
  if (!text || text.length < 100) return [text];
  if (Math.random() >= DOUBLE_TEXT_CHANCE) return [text];

  // Find first sentence-end (. ? ! …) in the first 30% of the response,
  // but no earlier than index 20 so part1 isn't trivially short.
  const cutoff = Math.floor(text.length * 0.3);
  for (let i = 20; i < cutoff; i++) {
    if ('.?!…'.includes(text[i]) && text[i + 1] === ' ') {
      const part1 = text.slice(0, i + 1).trim();
      const part2 = text.slice(i + 1).trim();
      if (part1 && part2) return [part1, part2];
    }
  }
  return [text];
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
    private promptBuilder: PromptBuilderService,
    private moderationService: ModerationService,
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

    // 2. Pull conversation + character.
    const conversation = await this.conversationsService.findOne(conversationId, userId);
    const character: any = conversation.character;
    const user: any = (conversation as any).user ?? {};

    // Determine NSFW pass-through via double-key check.
    const nsfwEnabled = this.moderationService.nsfwAllowed(
      { nsfwEnabled: Boolean(user.nsfwEnabled), ageVerified: Boolean(user.ageVerified) },
      { nsfwAllowed: Boolean(character.nsfwAllowed) },
    );

    // 2b. LAYER 1 — Pre-generation text moderation on user input.
    const inputCheck = await this.moderationService.checkUserInput({
      content,
      userId,
      conversationId,
      nsfwEnabled,
    });
    if (inputCheck.action === 'blocked') {
      yield { kind: 'text', chunk: "I can't respond to that. Let's talk about something else?" };
      yield { kind: 'complete' };
      return;
    }

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

    // 4. Build system prompt via PromptBuilder (structured persona template).
    let context = '';
    try {
      context = await this.ragService.getContext(conversationId, content);
    } catch (err) {
      this.logger.warn(`RAG context failed, continuing without: ${(err as Error).message}`);
    }

    // Memory receipt: every ~20 assistant messages, surface a specific
    // memory so the character feels like she's been thinking about the user.
    let memorySurfacing: string | null = null;
    const msgCount = (conversation as any).messageCount ?? 0;
    if (msgCount > 0 && msgCount % 20 === 19) {
      try {
        memorySurfacing = await this.ragService.getRandomMemorySummary(conversationId);
      } catch {
        // Non-critical — skip silently.
      }
    }

    const systemPrompt = this.promptBuilder.build(
      {
        displayName: character.displayName,
        backstory: (character as any).backstory,
        speechQuirks: (character as any).speechQuirks,
        bannedPhrases: (character as any).bannedPhrases,
        signaturePhrases: (character as any).signaturePhrases,
        warmth: character.warmth,
        playfulness: character.playfulness,
      },
      {
        ragContext: context,
        userTimezone: (conversation as any).user?.timezone ?? 'Asia/Baku',
        memorySurfacingHint: memorySurfacing,
      },
    );

    // 5. Brief thinking delay so the response feels human, not instant.
    const thinkingMs = computeThinkingDelayMs(content.length);
    yield { kind: 'typing', durationMs: thinkingMs };
    await sleep(thinkingMs);

    // 6. STREAMING LLM call with tool support. Text deltas arrive in
    //    real-time; tool calls are buffered and yielded at the end.
    let streamedText = '';
    let toolCalls: import('../../integrations/groq/groq.service').ToolCall[] = [];

    for await (const event of this.modelRouter.streamWithTools({
      prompt: content,
      systemPrompt,
      tools: [REQUEST_MEDIA_TOOL],
    })) {
      if (event.kind === 'delta') {
        streamedText += event.content;
        yield { kind: 'text', chunk: event.content };
      } else if (event.kind === 'tools') {
        toolCalls = event.toolCalls;
      }
    }

    // 6b. LAYER 2 — Post-generation text moderation on AI response.
    //     Moderation runs after streaming completes. If blocked, emit a
    //     retraction chunk that replaces the streamed content in the UI.
    let finalText = streamedText;
    if (finalText) {
      const outputCheck = await this.moderationService.checkAiResponse({
        content: finalText,
        conversationId,
        nsfwEnabled,
      });
      if (outputCheck.action === 'blocked') {
        finalText = "Hmm, I got a bit lost there. What were you saying?";
        toolCalls = [];
      }
    }

    // 7. Parse the tool call (if any) and kick off generation in parallel.
    const mediaArgs = extractMediaArgs(toolCalls);
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

    // 8. If no text was streamed (tool-only response), emit the caption.
    const textBody = (finalText || mediaArgs?.caption || '').trim();

    const modelUsed = (await this.modelRouter.detectLanguage(content)) === 'az' ? 'openai' : 'groq';
    const latencyMs = Date.now() - startTime;

    // Persist the assistant message.
    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: textBody,
        language: conversation.language,
        modelUsed,
        latencyMs,
      },
    });
    const lastMessageId = msg.id;

    const assistantMessage = { id: lastMessageId };

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

  // buildSystemPrompt removed — see PromptBuilderService.

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
