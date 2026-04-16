import { Injectable } from '@nestjs/common';
import { GroqService, type LlmResult, type ToolDefinition } from '../../../integrations/groq/groq.service';
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
 * Pre-response thinking delay. Humans don't reply instantly; a short pause
 * before the first token lands makes the stream feel like typing instead of
 * a bot firing. Delay scales with user-message length (more to read = more
 * to think about) with a small random jitter.
 */
export function computeThinkingDelayMs(userMessageLength: number): number {
  const base = 420;
  const perChar = 8;
  const jitter = Math.floor(Math.random() * 320);
  return Math.min(base + userMessageLength * perChar + jitter, 2400);
}

/**
 * Per-chunk delay when we emulate streaming from a non-streaming LLM call.
 * Roughly 30–55 chars/second typing rhythm, with tiny randomness so it
 * doesn't feel metronomic.
 */
export function computeChunkDelayMs(): number {
  return 18 + Math.floor(Math.random() * 22); // 18–40ms per chunk
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
   * Kept for paths that don't need tools (e.g. memory summarization).
   * chat.service uses generateWithTools above.
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
