import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreditsService } from './credits.service';

export const DAILY_REWARD_AMOUNT = 5;
export const DAILY_REWARD_CAP = 50; // Don't grant if balance already ≥ this.
export const PROFILE_BONUS_AMOUNT = 5;
export const STREAK_DAY_7_PREMIUM_DAYS = 7; // Day 7 reward: 1-week premium trial.

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
  nextAvailableAt: number;
  streak: number;
  streakReward?: string; // e.g. "7-day premium trial"
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
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        lastDailyRewardAt: true,
        loginStreak: true,
        lastStreakDate: true,
      } as any,
    })) as unknown as {
      credits: number;
      lastDailyRewardAt: Date | null;
      loginStreak: number;
      lastStreakDate: Date | null;
    } | null;

    if (!user) {
      return { granted: false, amount: 0, newBalance: 0, nextAvailableAt: tomorrowStart.getTime(), streak: 0 };
    }

    const lastClaim = user.lastDailyRewardAt;
    if (lastClaim && lastClaim >= todayStart) {
      return {
        granted: false,
        amount: 0,
        newBalance: user.credits,
        nextAvailableAt: tomorrowStart.getTime(),
        streak: user.loginStreak ?? 0,
      };
    }

    // Cap: skip credit grant if balance already at cap (but still bump streak).
    const grantCredits = user.credits < DAILY_REWARD_CAP;

    // Streak: if last streak date was yesterday, continue the streak.
    // Otherwise, reset to 1.
    const prevStreak = user.loginStreak ?? 0;
    const lastStreak = user.lastStreakDate;
    const isConsecutive =
      lastStreak &&
      startOfDayUtc(lastStreak).getTime() === yesterdayStart.getTime();
    const newStreak = isConsecutive ? prevStreak + 1 : 1;

    const result = await this.prisma.$transaction(async (tx) => {
      const fresh = (await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true, lastDailyRewardAt: true } as any,
      })) as unknown as { credits: number; lastDailyRewardAt: Date | null } | null;
      if (fresh?.lastDailyRewardAt && new Date(fresh.lastDailyRewardAt) >= todayStart) {
        return { granted: false, newBalance: fresh?.credits ?? 0, streak: newStreak };
      }

      const updateData: any = {
        lastDailyRewardAt: now,
        loginStreak: newStreak,
        lastStreakDate: todayStart,
      };
      if (grantCredits) {
        updateData.credits = { increment: DAILY_REWARD_AMOUNT };
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: updateData,
        select: { credits: true },
      });

      if (grantCredits) {
        await tx.transaction.create({
          data: {
            userId,
            type: 'EARN',
            amount: DAILY_REWARD_AMOUNT,
            balance: updated.credits,
            description: 'Daily login reward',
            metadata: { source: 'daily_reward', day: todayStart.toISOString(), streak: newStreak },
          },
        });
      }

      // Day 7 streak reward: 1-week premium trial.
      let streakReward: string | undefined;
      if (newStreak === 7) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + STREAK_DAY_7_PREMIUM_DAYS);
        await tx.user.update({
          where: { id: userId },
          data: { isPremium: true, premiumUntil },
        });
        streakReward = `${STREAK_DAY_7_PREMIUM_DAYS}-day premium trial`;
        this.logger.log(`Day 7 streak reward: granted ${streakReward} to user ${userId}`);
      }

      return { granted: grantCredits, newBalance: updated.credits, streak: newStreak, streakReward };
    });

    return {
      granted: result.granted,
      amount: result.granted ? DAILY_REWARD_AMOUNT : 0,
      newBalance: result.newBalance,
      nextAvailableAt: tomorrowStart.getTime(),
      streak: result.streak,
      streakReward: result.streakReward,
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
