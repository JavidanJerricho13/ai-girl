import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ModelRouterService, buildPersonalityBlock } from '../chat/services/model-router.service';
import { ConversationsGateway } from '../conversations/conversations.gateway';
import { PushService } from './push.service';

// Re-engagement windows. Inclusive on both sides: we only fire when the
// user's last user-message age falls in the window AND they haven't been
// proactively pinged yet today.
const MIN_INACTIVITY_MS = 6 * 60 * 60 * 1000;  // 6h
const MAX_INACTIVITY_MS = 12 * 60 * 60 * 1000; // 12h

// Hard cap on nudges per day per user. Intentionally low — the whole point
// of proactive messaging dies the moment it feels like spam.
const MAX_PROACTIVE_PER_DAY = 2;

// Safety net so a single cron tick can't DDOS the LLM. If there are more
// candidates than this, the rest roll over to the next tick.
const BATCH_LIMIT = 50;

interface Candidate {
  userId: string;
  conversationId: string;
  lastUserMessageAt: Date;
}

@Injectable()
export class EngagementService {
  private readonly logger = new Logger(EngagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly modelRouter: ModelRouterService,
    private readonly gateway: ConversationsGateway,
    private readonly push: PushService,
  ) {}

  /**
   * Finds users whose most-recent conversation has been quiet for 6-12h.
   * We pick the conversation, not the user, because a user may have many
   * characters — we only nudge on the one they were most recently talking
   * to (avoiding the awkwardness of a stale character reaching out).
   */
  async findCandidates(now = new Date()): Promise<Candidate[]> {
    const upperBound = new Date(now.getTime() - MIN_INACTIVITY_MS);
    const lowerBound = new Date(now.getTime() - MAX_INACTIVITY_MS);
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    // Raw SQL: Prisma doesn't ergonomically express "find the most-recent-
    // active conversation per user where last user-message age is in range
    // AND they have < N ProactiveLogs today".
    const rows = await this.prisma.$queryRaw<
      { userId: string; conversationId: string; lastUserMessageAt: Date }[]
    >`
      WITH last_user_msg AS (
        SELECT
          m."conversationId",
          MAX(m."createdAt") AS last_at
        FROM "Message" m
        WHERE m."role" = 'user'
        GROUP BY m."conversationId"
      ),
      ranked AS (
        SELECT
          c."userId",
          c."id" AS "conversationId",
          lum.last_at AS "lastUserMessageAt",
          ROW_NUMBER() OVER (PARTITION BY c."userId" ORDER BY lum.last_at DESC) AS rn
        FROM "Conversation" c
        JOIN last_user_msg lum ON lum."conversationId" = c."id"
        JOIN "User" u ON u."id" = c."userId"
        WHERE c."isActive" = true
          AND u."isActive" = true
          AND u."isGuest" = false
          AND lum.last_at BETWEEN ${lowerBound} AND ${upperBound}
      )
      SELECT r."userId", r."conversationId", r."lastUserMessageAt"
      FROM ranked r
      WHERE r.rn = 1
        AND (
          SELECT COUNT(*) FROM "ProactiveLog" pl
          WHERE pl."userId" = r."userId"
            AND pl."createdAt" >= ${todayStart}
        ) < ${MAX_PROACTIVE_PER_DAY}
      LIMIT ${BATCH_LIMIT}
    `;

    return rows;
  }

  /**
   * Generates and delivers a single proactive message end-to-end. Swallows
   * individual failures so one bad user doesn't break the whole batch.
   */
  async generateAndSend(candidate: Candidate): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: candidate.conversationId },
      include: { character: true, user: true },
    });
    if (!conversation || !conversation.character) return false;

    // Most-recent memory is the single best anchor for "I was thinking about
    // you" style continuity. One is enough — longer memory context is
    // unnecessary for a 1-2 sentence nudge.
    const memory = await this.prisma.memorySummary.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      select: { summary: true },
    });

    const prompt = this.buildPrompt(conversation.character, memory?.summary);

    let text: string;
    try {
      const result = await this.modelRouter.generateWithTools({
        prompt: 'Send one short opening line.',
        systemPrompt: prompt,
      });
      text = (result.content || '').trim();
      if (!text) return false;
    } catch (err) {
      this.logger.error(
        `LLM generation failed for user=${candidate.userId}: ${(err as Error).message}`,
      );
      return false;
    }

    // Persist the message + log atomically so we can never end up with a
    // delivered message missing its rate-limit entry (or vice versa).
    const { message } = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: text,
          language: conversation.language,
          modelUsed: 'proactive',
        },
      });
      // `as any` until `prisma generate` is re-run against the new schema.
      // Runtime is fine — the table exists once the migration ran.
      await (tx as any).proactiveLog.create({
        data: {
          userId: candidate.userId,
          conversationId: conversation.id,
          messageId: msg.id,
          trigger: 'inactivity_6_12h',
        },
      });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), messageCount: { increment: 1 } },
      });
      return { message: msg };
    });

    // Deliver. Socket push is best-effort — if the user is offline, the
    // message is already in DB and they'll see it on next /conversations
    // fetch. Push notification is the backstop.
    this.gateway.emitProactiveMessage(candidate.userId, {
      conversationId: conversation.id,
      characterId: conversation.character.id,
      messageId: message.id,
      content: text,
      createdAt: message.createdAt.toISOString(),
    });

    await this.push.sendProactive({
      userId: candidate.userId,
      characterName: conversation.character.displayName,
      preview: text,
      conversationId: conversation.id,
    });

    return true;
  }

  async runBatch(): Promise<{ attempted: number; delivered: number }> {
    const candidates = await this.findCandidates();
    if (!candidates.length) return { attempted: 0, delivered: 0 };

    this.logger.log(`Proactive batch: ${candidates.length} candidate(s)`);
    let delivered = 0;
    for (const candidate of candidates) {
      try {
        const ok = await this.generateAndSend(candidate);
        if (ok) delivered += 1;
      } catch (err) {
        this.logger.error(
          `generateAndSend failed for user=${candidate.userId}: ${(err as Error).message}`,
        );
      }
    }
    return { attempted: candidates.length, delivered };
  }

  private buildPrompt(character: any, memory: string | null | undefined): string {
    const personality = buildPersonalityBlock({
      warmth: character.warmth,
      playfulness: character.playfulness,
    });

    // The model is told the OUTPUT shape explicitly because re-engagement
    // messages want a different rhythm than reactive replies — one short
    // line, no questions stacked on questions, no explicit "I miss you"
    // (it reads as needy when the message arrives out of the blue).
    return [
      character.systemPrompt || 'You are a warm AI companion.',
      personality,
      memory
        ? `Most recent thing you remember about this person:\n${memory}`
        : '',
      '',
      'You are initiating contact after a quiet stretch of hours. Write ONE short text message — under 140 characters, one or two sentences max — as if a detail of your day reminded you of them. Do NOT ask "how are you" or "where have you been". Do NOT apologise for the gap. Do NOT mention time or absence. Just a small observation or image that prompted you to write.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
