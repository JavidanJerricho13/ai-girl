import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { TransactionType } from '@prisma/client';

export interface CreditTransaction {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: any;
}

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Deduct credits atomically with balance check
   */
  async deductCredits(params: {
    userId: string;
    amount: number;
    description: string;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number }> {
    const { userId, amount, description, metadata } = params;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Get current user and lock row for update
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true, isPremium: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        // Check sufficient balance
        if (user.credits < amount) {
          throw new BadRequestException(
            `Insufficient credits. You have ${user.credits}, but need ${amount}`,
          );
        }

        // Deduct credits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: { decrement: amount } },
          select: { credits: true },
        });

        // Log transaction
        await tx.transaction.create({
          data: {
            userId,
            type: TransactionType.SPEND,
            amount: -amount,
            balance: updatedUser.credits,
            description,
            metadata,
          },
        });

        return {
          success: true,
          newBalance: updatedUser.credits,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to deduct credits');
    }
  }

  /**
   * Add credits (for purchases)
   */
  async addCredits(params: {
    userId: string;
    amount: number;
    description: string;
    type?: TransactionType;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number }> {
    const {
      userId,
      amount,
      description,
      type = TransactionType.PURCHASE,
      metadata,
    } = params;

    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Add credits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: { increment: amount } },
          select: { credits: true },
        });

        // Log transaction
        await tx.transaction.create({
          data: {
            userId,
            type,
            amount,
            balance: updatedUser.credits,
            description,
            metadata,
          },
        });

        return {
          success: true,
          newBalance: updatedUser.credits,
        };
      });

      return result;
    } catch (error) {
      throw new BadRequestException('Failed to add credits');
    }
  }

  /**
   * Get user credit balance
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user.credits;
  }

  /**
   * Get transaction history
   */
  async getTransactions(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, limit = 50, offset = 0 } = params;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.transaction.count({
        where: { userId },
      }),
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Check if user has sufficient credits
   */
  async hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Refund credits
   */
  async refundCredits(params: {
    userId: string;
    amount: number;
    description: string;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number }> {
    return this.addCredits({
      ...params,
      type: TransactionType.REFUND,
    });
  }

  /**
   * Grant free credits (daily login, referrals, etc.)
   */
  async grantFreeCredits(params: {
    userId: string;
    amount: number;
    description: string;
    metadata?: any;
  }): Promise<{ success: boolean; newBalance: number }> {
    return this.addCredits({
      ...params,
      type: TransactionType.EARN,
    });
  }
}
