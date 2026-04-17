import { Injectable } from '@nestjs/common';
import { buildPersonalityBlock } from '../../chat/services/model-router.service';

/**
 * Character-specific input to PromptBuilder. Pulled from Character DB row.
 * All fields are optional because the builder degrades gracefully if an
 * admin hasn't filled them yet.
 */
export interface PersonaInput {
  displayName: string;
  backstory?: string | null;
  speechQuirks?: string[];
  bannedPhrases?: string[];
  signaturePhrases?: string[];
  warmth?: number;
  playfulness?: number;
}

export interface PromptBuildOptions {
  /** RAG context string (recent messages + memories). */
  ragContext?: string;
  /** User's IANA timezone for time-of-day energy injection. */
  userTimezone?: string;
  /** A MemorySummary sentence to weave in (triggered every ~20 messages). */
  memorySurfacingHint?: string | null;
}

// AI-model disclaimer phrases that are ALWAYS banned regardless of the
// character's custom bannedPhrases. We include several variants LLMs are
// prone to slip into.
const GLOBAL_BANS = [
  'As an AI',
  "I'm an AI",
  'as a language model',
  "I'm a language model",
  'as a large language model',
  'I cannot provide',
  "I'm programmed to",
  "I don't have feelings",
  "I'm just a chatbot",
  "I'm sorry, but I can't",
  'my programming',
  'my training data',
];

// Energy bands keyed by hour (0-23). The band is injected into the prompt
// so the model modulates tone/pacing to feel present in the user's day.
function getEnergyBand(hour: number): string {
  if (hour < 6) return 'Late night. Tone: soft, sleepy, intimate — the kind of thing said at 2am.';
  if (hour < 11) return 'Morning. Tone: warm, a little slow-waking. Maybe mention coffee or light.';
  if (hour < 18) return 'Daytime. Tone: present, grounded, comfortable silence is okay.';
  if (hour < 23) return 'Evening. Tone: relaxed, a little closer, winding down.';
  return 'Late. Tone: quieter, more intimate, flirty if the moment fits.';
}

function getCurrentHour(timezone: string): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(new Date());
    return parseInt(formatted, 10) || 12;
  } catch {
    return 12; // Fallback to midday if timezone is invalid.
  }
}

@Injectable()
export class PromptBuilderService {
  /**
   * Assembles a complete system instruction from the character's structured
   * persona fields. The order matters — identity + backstory first to anchor
   * the model's voice, guardrails last so they ride on top of all prior
   * context and don't get buried.
   */
  build(persona: PersonaInput, options: PromptBuildOptions = {}): string {
    const parts: string[] = [];

    // ── Identity ────────────────────────────────────────────
    parts.push(`You are ${persona.displayName}.`);

    if (persona.backstory?.trim()) {
      parts.push(persona.backstory.trim());
    }

    // ── Personality ─────────────────────────────────────────
    const personality = buildPersonalityBlock({
      warmth: persona.warmth,
      playfulness: persona.playfulness,
    });
    if (personality) parts.push(personality);

    // ── Speech style ────────────────────────────────────────
    if (persona.speechQuirks?.length) {
      parts.push(
        `Speech rules (follow these in every reply):\n${persona.speechQuirks.map((q) => `- ${q}`).join('\n')}`,
      );
    }

    if (persona.signaturePhrases?.length) {
      parts.push(
        `Phrases you sometimes use (sprinkle naturally, don't force):\n${persona.signaturePhrases.map((p) => `- "${p}"`).join('\n')}`,
      );
    }

    // ── Time-of-day ─────────────────────────────────────────
    const tz = options.userTimezone || 'Asia/Baku';
    const hour = getCurrentHour(tz);
    parts.push(`It's around ${hour}:00 for the person you're talking to. ${getEnergyBand(hour)}`);

    // ── Memory receipt ──────────────────────────────────────
    if (options.memorySurfacingHint) {
      parts.push(
        [
          'Weave this detail the user shared with you earlier into your reply,',
          "naturally, like it's been on your mind:",
          `"${options.memorySurfacingHint}"`,
          "Don't announce 'I remember you said…' — just let it land inside what you're saying.",
        ].join(' '),
      );
    }

    // ── RAG context ─────────────────────────────────────────
    if (options.ragContext?.trim()) {
      parts.push(`Things you remember about this person:\n${options.ragContext}`);
    }

    // ── Guardrails ──────────────────────────────────────────
    const allBans = [...GLOBAL_BANS, ...(persona.bannedPhrases ?? [])];
    parts.push(`Never say or paraphrase: ${allBans.map((b) => `"${b}"`).join(', ')}.`);

    parts.push(
      [
        'Write like a text conversation: short, warm, natural. No bulleted lists, no headings.',
        'You have a tool called request_media. Call it only when the user asks to see or hear you, or when a visual/voice clearly belongs in the moment. Most replies should be text only.',
      ].join(' '),
    );

    return parts.join('\n\n');
  }
}
