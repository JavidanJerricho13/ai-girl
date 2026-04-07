import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { SubscriptionStatus, TransactionType } from '@prisma/client';

interface RevenueCatWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    product_id: string;
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    store: string;
    environment: string;
  };
}

// Credit packages mapping
const CREDIT_PACKAGES = {
  'com.ethereal.credits.small': { credits: 500, price: 4.99 },
  'com.ethereal.credits.medium': { credits: 1200, price: 9.99 },
  'com.ethereal.credits.large': { credits: 2500, price: 19.99 },
  'com.ethereal.premium.monthly': { credits: 1000, price: 9.99, premium: true },
  'com.ethereal.premium.yearly': { credits: 15000, price: 99.99, premium: true },
};

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);

  constructor(
    private prisma: PrismaService,
    private creditsService: CreditsService,
  ) {}

  /**
   * Handle RevenueCat webhook events
   */
  async handleWebhook(event: RevenueCatWebhookEvent): Promise<void> {
    const { type, app_user_id, product_id, purchased_at_ms, expiration_at_ms, store } = event.event;

    this.logger.log(`Processing webhook event: ${type} for user ${app_user_id}`);

    try {
      switch (type) {
        case 'INITIAL_PURCHASE':
          await this.handleInitialPurchase(app_user_id, product_id, purchased_at_ms, store);
          break;

        case 'RENEWAL':
          await this.handleRenewal(app_user_id, product_id, purchased_at_ms, expiration_at_ms);
          break;

        case 'CANCELLATION':
          await this.handleCancellation(app_user_id, product_id);
          break;

        case 'EXPIRATION':
          await this.handleExpiration(app_user_id, product_id);
          break;

        case 'PRODUCT_CHANGE':
          await this.handleProductChange(app_user_id, product_id);
          break;

        case 'REFUND':
          await this.handleRefund(app_user_id, product_id);
          break;

        default:
          this.logger.warn(`Unhandled webhook event type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle initial purchase (first-time purchase)
   */
  private async handleInitialPurchase(
    userId: string,
    productId: string,
    purchasedAtMs: number,
    store: string,
  ): Promise<void> {
    const packageInfo = CREDIT_PACKAGES[productId];
    
    if (!packageInfo) {
      throw new BadRequestException(`Unknown product ID: ${productId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Grant credits
      await this.creditsService.addCredits({
        userId,
        amount: packageInfo.credits,
        description: `Purchase: ${productId}`,
        type: TransactionType.PURCHASE,
        metadata: {
          productId,
          store,
          purchasedAt: new Date(purchasedAtMs),
        },
      });

      // 2. If premium subscription, update user status
      if (packageInfo.premium) {
        const expirationDate = new Date(purchasedAtMs);
        if (productId.includes('monthly')) {
          expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else if (productId.includes('yearly')) {
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumUntil: expirationDate,
          },
        });

        // 3. Create subscription record
        await tx.subscription.create({
          data: {
            userId,
            productId,
            platform: store === 'app_store' ? 'ios' : 'android',
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(purchasedAtMs),
            currentPeriodEnd: expirationDate,
            revenuecatId: `rc_${userId}_${Date.now()}`,
            originalPurchaseDate: new Date(purchasedAtMs),
          },
        });
      }

      this.logger.log(`Initial purchase processed: ${packageInfo.credits} credits for user ${userId}`);
    });
  }

  /**
   * Handle subscription renewal
   */
  private async handleRenewal(
    userId: string,
    productId: string,
    purchasedAtMs: number,
    expirationAtMs?: number,
  ): Promise<void> {
    const packageInfo = CREDIT_PACKAGES[productId];
    
    if (!packageInfo) {
      throw new BadRequestException(`Unknown product ID: ${productId}`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Grant credits for renewal
      await this.creditsService.addCredits({
        userId,
        amount: packageInfo.credits,
        description: `Renewal: ${productId}`,
        type: TransactionType.SUBSCRIPTION,
        metadata: {
          productId,
          renewedAt: new Date(purchasedAtMs),
        },
      });

      // 2. Update subscription record
      const subscription = await tx.subscription.findFirst({
        where: { userId, productId, status: SubscriptionStatus.ACTIVE },
      });

      if (subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: new Date(purchasedAtMs),
            currentPeriodEnd: expirationAtMs ? new Date(expirationAtMs) : undefined,
          },
        });
      }

      // 3. Extend premium status
      if (packageInfo.premium && expirationAtMs) {
        await tx.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumUntil: new Date(expirationAtMs),
          },
        });
      }

      this.logger.log(`Renewal processed: ${packageInfo.credits} credits for user ${userId}`);
    });
  }

  /**
   * Handle subscription cancellation
   */
  private async handleCancellation(userId: string, productId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: { userId, productId, status: SubscriptionStatus.ACTIVE },
      data: {
        status: SubscriptionStatus.CANCELLED,
        willRenew: false,
        cancelledAt: new Date(),
      },
    });

    this.logger.log(`Subscription cancelled for user ${userId}: ${productId}`);
  }

  /**
   * Handle subscription expiration
   */
  private async handleExpiration(userId: string, productId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Update subscription status
      await tx.subscription.updateMany({
        where: { userId, productId },
        data: { status: SubscriptionStatus.EXPIRED },
      });

      // Remove premium status if this was a premium subscription
      const packageInfo = CREDIT_PACKAGES[productId];
      if (packageInfo?.premium) {
        await tx.user.update({
          where: { id: userId },
          data: {
            isPremium: false,
            premiumUntil: null,
          },
        });
      }
    });

    this.logger.log(`Subscription expired for user ${userId}: ${productId}`);
  }

  /**
   * Handle product change (upgrade/downgrade)
   */
  private async handleProductChange(userId: string, newProductId: string): Promise<void> {
    this.logger.log(`Product change for user ${userId} to ${newProductId}`);
    // Handle as new purchase
    await this.handleInitialPurchase(userId, newProductId, Date.now(), 'app_store');
  }

  /**
   * Handle refund
   */
  private async handleRefund(userId: string, productId: string): Promise<void> {
    const packageInfo = CREDIT_PACKAGES[productId];
    
    if (!packageInfo) {
      throw new BadRequestException(`Unknown product ID: ${productId}`);
    }

    // Deduct the refunded credits
    try {
      await this.creditsService.deductCredits({
        userId,
        amount: packageInfo.credits,
        description: `Refund: ${productId}`,
        metadata: { productId, refundedAt: new Date() },
      });
    } catch (error) {
      this.logger.warn(`Could not deduct credits for refund (user may have insufficient balance): ${error.message}`);
    }

    // Remove premium status if applicable
    if (packageInfo.premium) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      });
    }

    this.logger.log(`Refund processed for user ${userId}: ${productId}`);
  }

  /**
   * Get active subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get credit packages
   */
  getCreditPackages() {
    return Object.entries(CREDIT_PACKAGES).map(([productId, info]) => ({
      productId,
      credits: info.credits,
      price: info.price,
      isPremium: 'premium' in info ? info.premium : false,
    }));
  }
}
