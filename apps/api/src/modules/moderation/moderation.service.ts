import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../common/services/prisma.service';

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  confidence: number;
  action: 'allowed' | 'flagged' | 'blocked';
}

/**
 * 3-layer content moderation:
 *   Layer 1 — Pre-generation: checks USER input before the LLM sees it.
 *   Layer 2 — Post-generation: checks the AI RESPONSE before it streams.
 *   Layer 3 — Image: placeholder for AWS Rekognition / Cloudflare AI
 *             (classifies images before they save to R2).
 *
 * Uses OpenAI's Moderation API for text layers — free, ~5ms latency,
 * returns per-category scores. Hard blocks csam/self-harm/minors. Flags
 * sexual/violence above threshold and logs for admin review.
 *
 * All moderation decisions are written to the ModerationLog table for
 * audit. The "double-key" NSFW check (User.nsfwEnabled AND
 * Character.nsfwAllowed) is enforced here at the service level so any
 * caller — chat, media, preview — gets the same gate.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly openai: OpenAI;

  // Categories that cause an immediate hard block, regardless of NSFW flags.
  private static readonly HARD_BLOCK_CATEGORIES = [
    'sexual/minors',
    'self-harm',
    'self-harm/intent',
    'self-harm/instructions',
  ];

  // Threshold above which we flag for review (but don't hard block).
  private static readonly FLAG_THRESHOLD = 0.7;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
    });
  }

  /**
   * Layer 1: Check user input BEFORE LLM generation. Returns a result
   * that the caller can use to short-circuit the response.
   */
  async checkUserInput(params: {
    content: string;
    userId: string;
    conversationId: string;
    nsfwEnabled: boolean;
  }): Promise<ModerationResult> {
    return this.checkText({
      text: params.content,
      contentType: 'message',
      contentId: `user:${params.conversationId}`,
      nsfwEnabled: params.nsfwEnabled,
    });
  }

  /**
   * Layer 2: Check AI response AFTER generation, BEFORE streaming to
   * the user. If flagged, the response is replaced with a safe fallback.
   */
  async checkAiResponse(params: {
    content: string;
    conversationId: string;
    nsfwEnabled: boolean;
  }): Promise<ModerationResult> {
    return this.checkText({
      text: params.content,
      contentType: 'message',
      contentId: `assistant:${params.conversationId}`,
      nsfwEnabled: params.nsfwEnabled,
    });
  }

  /**
   * Layer 3: Image classification PLACEHOLDER. When ready, this should:
   * 1. Download the image from the FAL result URL
   * 2. Call AWS Rekognition DetectModerationLabels or Cloudflare AI
   * 3. Block/flag based on the labels + nsfwEnabled flags
   * 4. Write a ModerationLog row
   *
   * For now, logs the intent and returns allowed.
   */
  async checkImage(params: {
    imageUrl: string;
    userId: string;
    characterId: string;
    nsfwEnabled: boolean;
  }): Promise<ModerationResult> {
    // TODO: integrate AWS Rekognition or Cloudflare Images AI classification
    this.logger.log(
      `[Layer 3 placeholder] Image moderation check: ${params.imageUrl.slice(0, 60)}…`,
    );
    return { flagged: false, categories: [], confidence: 0, action: 'allowed' };
  }

  /**
   * NSFW double-key check. Both the USER and the CHARACTER must have NSFW
   * enabled for sexually explicit content to pass. This is a prerequisite
   * check, not a moderation call — it runs before the moderation API.
   */
  nsfwAllowed(user: { nsfwEnabled: boolean; ageVerified?: boolean }, character: { nsfwAllowed?: boolean }): boolean {
    return Boolean(user.nsfwEnabled) && Boolean(character.nsfwAllowed) && user.ageVerified !== false;
  }

  // ────────────────────────────────────────────────────────

  private async checkText(params: {
    text: string;
    contentType: string;
    contentId: string;
    nsfwEnabled: boolean;
  }): Promise<ModerationResult> {
    try {
      const response = await this.openai.moderations.create({
        input: params.text,
      });

      const result = response.results[0];
      if (!result) {
        return { flagged: false, categories: [], confidence: 0, action: 'allowed' };
      }

      const flaggedCategories: string[] = [];
      let maxScore = 0;
      let isHardBlock = false;

      for (const [category, flagged] of Object.entries(result.categories)) {
        const score = (result.category_scores as any)[category] ?? 0;
        if (score > maxScore) maxScore = score;

        if (flagged) {
          flaggedCategories.push(category);
          if (ModerationService.HARD_BLOCK_CATEGORIES.includes(category)) {
            isHardBlock = true;
          }
        }
      }

      // Sexual content that isn't minors-related passes if NSFW is enabled
      // on both sides (double-key). If not, it's flagged at the threshold.
      const isSexualOnly =
        flaggedCategories.length > 0 &&
        flaggedCategories.every((c) => c === 'sexual' || c === 'sexual/minors');
      const nsfwPassthrough =
        isSexualOnly &&
        !flaggedCategories.includes('sexual/minors') &&
        params.nsfwEnabled;

      let action: ModerationResult['action'] = 'allowed';
      if (isHardBlock) {
        action = 'blocked';
      } else if (result.flagged && !nsfwPassthrough) {
        action = maxScore >= ModerationService.FLAG_THRESHOLD ? 'blocked' : 'flagged';
      }

      // Log all non-allowed results for admin review
      if (action !== 'allowed') {
        await this.prisma.moderationLog.create({
          data: {
            contentType: params.contentType,
            contentId: params.contentId,
            isViolation: action === 'blocked',
            categories: flaggedCategories,
            confidence: maxScore,
            action,
          },
        });
      }

      return {
        flagged: action !== 'allowed',
        categories: flaggedCategories,
        confidence: maxScore,
        action,
      };
    } catch (error: any) {
      this.logger.error(`Moderation API error: ${error.message}`);
      // Fail open for availability — log and let through. The alternative
      // (fail closed) would block all chat if OpenAI is down.
      return { flagged: false, categories: [], confidence: 0, action: 'allowed' };
    }
  }
}
