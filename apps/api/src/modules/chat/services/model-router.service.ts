import { Injectable } from '@nestjs/common';
import { GroqService, type LlmResult, type ToolDefinition, type ToolCall } from '../../../integrations/groq/groq.service';
import { OpenAIService } from '../../../integrations/openai/openai.service';

// Personality is stored on Character as two 0–100 axes (simplified from
// four — see cut-to-ship refactor). Each axis maps to a band with a
// human-readable cue the LLM can act on, rather than binary >50/<50 which
// loses nuance in the middle.
type PersonalityInput = {
  warmth?: number;
  playfulness?: number;
};

const AXIS_BANDS = [
  { max: 20, label: 'very' },
  { max: 40, label: 'somewhat' },
  { max: 60, label: 'balanced' },
  { max: 80, label: 'notably' },
  { max: 100, label: 'strongly' },
] as const;

function bandFor(value: number | undefined): (typeof AXIS_BANDS)[number]['label'] {
  const v = Math.max(0, Math.min(100, value ?? 50));
  return AXIS_BANDS.find((b) => v <= b.max)!.label;
}

// Build the personality block we inject into the system prompt. Keep the
// wording first-person ("You are...") so the LLM slides into character.
export function buildPersonalityBlock(p: PersonalityInput): string {
  const lines: string[] = [];

  const warmth = p.warmth ?? 50;
  if (warmth !== 50) {
    const band = bandFor(warmth);
    const trait =
      warmth > 50
        ? 'warm, nurturing, physically present — you notice the person, not just the words'
        : 'cool, self-contained, a little guarded — you warm up slowly, not on cue';
    lines.push(`- Warmth: you are ${band} ${trait}.`);
  }

  const playfulness = p.playfulness ?? 50;
  if (playfulness !== 50) {
    const band = bandFor(playfulness);
    const trait =
      playfulness > 50
        ? 'playful, teasing, quick-witted — you turn sentences sideways just to see them land'
        : 'grave, deliberate, considered — you treat ideas and feelings with weight';
    lines.push(`- Playfulness: you are ${band} ${trait}.`);
  }

  if (!lines.length) return '';

  return [
    'Personality (internalize these; never name them aloud):',
    ...lines,
    'Let these shape *how* you say things — word choice, sentence length, punctuation rhythm — not just what you say.',
  ].join('\n');
}

/**
 * Pre-LLM thinking delay — a short beat before the model is even called.
 * Simulates her "reading the message" before she starts typing. Shorter
 * than the old value because the main typing simulation now lives in the
 * per-chunk pacing after the LLM resolves.
 */
export function computeThinkingDelayMs(userMessageLength: number): number {
  const base = 200;
  const perChar = 4;
  const jitter = Math.floor(Math.random() * 300);
  return Math.min(base + userMessageLength * perChar + jitter, 1200);
}

/**
 * Post-LLM typing delay — the full "she's typing" window the user sees.
 * Scales with her RESPONSE length (longer replies = longer typing) and
 * includes a human-like jitter band. Capped at 12s so a long reply
 * doesn't freeze the thread.
 *   Formula: responseLength × 40ms + 500ms + random(0-1000ms)
 */
export function computeTypingDelayMs(responseLength: number): number {
  return Math.min(responseLength * 40 + 500 + Math.floor(Math.random() * 1000), 12000);
}

/**
 * Per-chunk delay derived from the total typing window. Adds ±15% jitter
 * per chunk so the stream doesn't feel metronomic.
 */
export function computeChunkDelayMs(totalMs: number, chunkCount: number): number {
  if (chunkCount <= 0) return 20;
  const base = Math.max(18, totalMs / chunkCount);
  const jitter = base * 0.15 * (Math.random() * 2 - 1); // ±15%
  return Math.max(10, Math.round(base + jitter));
}

@Injectable()
export class ModelRouterService {
  constructor(
    private groqService: GroqService,
    private openAIService: OpenAIService,
  ) {}

  async detectLanguage(text: string): Promise<'en' | 'az'> {
    const azCharacters = /[əöüğışçӘÖÜĞIŞÇ]/;
    return azCharacters.test(text) ? 'az' : 'en';
  }

  /**
   * Non-streaming, tool-capable generation. We call the provider synchronously
   * so tool_calls parse cleanly; chat.service then emulates streaming back
   * to the client with typing delays, which lets us keep a single code path
   * for both the plain-text and tool-call cases.
   */
  async generateWithTools(params: {
    prompt: string;
    systemPrompt: string;
    tools?: ToolDefinition[];
  }): Promise<LlmResult> {
    const language = await this.detectLanguage(params.prompt);
    const provider = language === 'az' ? this.openAIService : this.groqService;
    return provider.generateWithTools({
      systemPrompt: params.systemPrompt,
      userMessage: params.prompt,
      tools: params.tools,
    });
  }

  /**
   * Stream text deltas in real-time with tool support. Yields delta events
   * as tokens arrive from the LLM, then a tools event at the end if any
   * tool calls were made. Falls back to non-streaming for Azerbaijani
   * (OpenAI path) until OpenAI streaming with tools is wired.
   */
  async *streamWithTools(params: {
    prompt: string;
    systemPrompt: string;
    tools?: ToolDefinition[];
  }): AsyncGenerator<
    | { kind: 'delta'; content: string }
    | { kind: 'tools'; toolCalls: ToolCall[] }
  > {
    const language = await this.detectLanguage(params.prompt);

    if (language === 'az') {
      // Fallback: non-streaming for OpenAI/AZ path, emit as single delta
      const result = await this.openAIService.generateWithTools({
        systemPrompt: params.systemPrompt,
        userMessage: params.prompt,
        tools: params.tools,
      });
      if (result.content) {
        yield { kind: 'delta', content: result.content };
      }
      if (result.toolCalls.length > 0) {
        yield { kind: 'tools', toolCalls: result.toolCalls };
      }
      return;
    }

    yield* this.groqService.streamWithTools({
      systemPrompt: params.systemPrompt,
      userMessage: params.prompt,
      tools: params.tools,
    });
  }

  /**
   * Kept for paths that don't need tools (e.g. memory summarization).
   * chat.service uses streamWithTools above for real-time streaming.
   */
  async *generateResponse(params: {
    prompt: string;
    systemPrompt: string;
  }) {
    const language = await this.detectLanguage(params.prompt);

    if (language === 'az') {
      yield* this.openAIService.streamResponse({
        systemPrompt: params.systemPrompt,
        userMessage: params.prompt,
      });
    } else {
      yield* this.groqService.streamResponse({
        systemPrompt: params.systemPrompt,
        userMessage: params.prompt,
      });
    }
  }
}
