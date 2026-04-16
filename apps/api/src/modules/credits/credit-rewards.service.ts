import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreditsService } from './credits.service';

export const DAILY_REWARD_AMOUNT = 10;
export const PROFILE_BONUS_AMOUNT = 5;

// Each bonus key maps to (a) the amount and (b) an eligibility check against
// the current User row. Idempotency is stored in User.bonusesClaimed[], so
// a bonus can only be granted once per key per user.
const PROFILE_BONUSES = {
  email_verified: {
    amount: PROFILE_BONUS_AMOUNT,
    description: 'Verified your email',
    eligible: (u: { isVerified: boolean }) => u.isVerified === true,
  },
  avatar_added: {
    amount: PROFILE_BONUS_AMOUNT,
    description: 'Added a profile avatar',
    eligible: (u: { avatar: string | null }) => typeof u.avatar === 'string' && u.avatar.length > 0,
  },
} as const;

type BonusKey = keyof typeof PROFILE_BONUSES;

export interface DailyRewardResult {
  granted: boolean;
  amount: number;
  newBalance: number;
  // Unix epoch ms when the next daily reward becomes available (start of
  // tomorrow UTC). Frontend uses this to show a countdown / disable the CTA.
  nextAvailableAt: number;
}

export interface ProfileBonusResult {
  granted: BonusKey[];
  skipped: BonusKey[];
  totalAmount: number;
  newBalance: number;
}

function startOfDayUtc(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class CreditRewardsService {
  private readonly logger = new Logger(CreditRewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  /**
   * Grant the daily login reward if the user hasn't claimed one yet today
   * (UTC). Idempotent — calling twice on the same day is a no-op.
   */
  async grantDailyReward(userId: string): Promise<DailyRewardResult> {
    const now = new Date();
    const todayStart = startOfDayUtc(now);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // `select` is cast loosely so we can reference new schema fields before
    // `prisma generate` has run against them; cast the result to the shape
    // we actually expect.
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, lastDailyRewardAt: true } as any,
    })) as unknown as { credits: number; lastDailyRewardAt: Date | null } | null;

    if (!user) {
      return {
        granted: false,
        amount: 0,
        newBalance: 0,
        nextAvailableAt: tomorrowStart.getTime(),
      };
    }

    const lastClaim = user.lastDailyRewardAt;
    if (lastClaim && lastClaim >= todayStart) {
      return {
        granted: false,
        amount: 0,
        newBalance: user.credits,
        nextAvailableAt: tomorrowStart.getTime(),
      };
    }

    // Atomic credit grant + timestamp update. We do the timestamp inside the
    // same transaction so two concurrent calls can't both succeed (the second
    // would see the stamp inside the tx).
    const result = await this.prisma.$transaction(async (tx) => {
      const fresh = (await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, lastDailyRewardAt: true } as any,
      })) as unknown as { credits: number; lastDailyRewardAt: Date | null } | null;
      if (fresh?.lastDailyRewardAt && new Date(fresh.lastDailyRewardAt) >= todayStart) {
        return { granted: false, newBalance: fresh.credits };
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: DAILY_REWARD_AMOUNT },
          ...({ lastDailyRewardAt: now } as any),
        },
        select: { credits: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'EARN',
          amount: DAILY_REWARD_AMOUNT,
          balance: updated.credits,
          description: 'Daily login reward',
          metadata: { source: 'daily_reward', day: todayStart.toISOString() },
        },
      });

      return { granted: true, newBalance: updated.credits };
    });

    return {
      granted: result.granted,
      amount: result.granted ? DAILY_REWARD_AMOUNT : 0,
      newBalance: result.newBalance,
      nextAvailableAt: tomorrowStart.getTime(),
    };
  }

  /**
   * Scan the user's profile state for unclaimed bonuses they're eligible for
   * and grant them. Idempotent — each bonus key is stored in
   * bonusesClaimed[] so we never double-grant.
   *
   * This is pull-based rather than event-driven: the frontend calls this
   * endpoint after profile edits and on (app) layout mount, which keeps
   * the users module untouched and handles the case where a user had
   * already set their avatar before this feature shipped.
   */
  async grantPendingProfileBonuses(userId: string): Promise<ProfileBonusResult> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        avatar: true,
        isVerified: true,
        bonusesClaimed: true,
      } as any,
    })) as unknown as
      | {
          credits: number;
          avatar: string | null;
          isVerified: boolean;
          bonusesClaimed: string[];
        }
      | null;

    if (!user) {
      return { granted: [], skipped: [], totalAmount: 0, newBalance: 0 };
    }

    const alreadyClaimed = new Set<string>(user.bonusesClaimed ?? []);
    const eligible: BonusKey[] = [];
    const skipped: BonusKey[] = [];

    (Object.keys(PROFILE_BONUSES) as BonusKey[]).forEach((key) => {
      const cfg = PROFILE_BONUSES[key];
      if (alreadyClaimed.has(key)) {
        skipped.push(key);
        return;
      }
      if (!cfg.eligible(user as any)) {
        skipped.push(key);
        return;
      }
      eligible.push(key);
    });

    if (!eligible.length) {
      return { granted: [], skipped, totalAmount: 0, newBalance: user.credits };
    }

    const totalAmount = eligible.reduce((sum, key) => sum + PROFILE_BONUSES[key].amount, 0);

    // Do the grant in a single transaction: append keys, bump credits, log
    // one Transaction row per bonus so /credits history stays useful.
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = (await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: totalAmount },
          ...({ bonusesClaimed: { push: eligible } } as any),
        },
        select: { credits: true },
      })) as unknown as { credits: number };

      for (const key of eligible) {
        const cfg = PROFILE_BONUSES[key];
        await tx.transaction.create({
          data: {
            userId,
            type: 'EARN',
            amount: cfg.amount,
            balance: updated.credits,
            description: cfg.description,
            metadata: { source: 'profile_bonus', bonusKey: key },
          },
        });
      }

      return { newBalance: updated.credits };
    });

    this.logger.log(`Granted ${totalAmount} credits to user ${userId} for bonuses: ${eligible.join(', ')}`);

    return {
      granted: eligible,
      skipped,
      totalAmount,
      newBalance: result.newBalance,
    };
  }
}
