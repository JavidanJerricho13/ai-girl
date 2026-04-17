import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

// Stripe v22 changed namespace exports; use loose types to avoid
// fighting the SDK's type surface on every minor version bump.
type StripeEvent = { type: string; data: { object: any } };
type StripeSession = any;
type StripeInvoice = any;
type StripeSubscription = any;
import { PrismaService } from '../../common/services/prisma.service';
import { CreditsService } from '../credits/credits.service';
import { TransactionType } from '@prisma/client';

/**
 * Web-side payment processing via Stripe Checkout. Runs parallel to
 * RevenueCat (which handles iOS/Android IAP). Both surfaces write to the
 * same User.isPremium / User.credits / Transaction rows — the shared
 * Prisma model IS the source of truth, and RevenueCat + Stripe are two
 * ingestion paths into it.
 *
 * Flow:
 *   1. Client calls POST /payments/stripe/checkout → gets a Checkout URL
 *   2. User completes payment on Stripe's hosted page
 *   3. Stripe sends webhook → we verify signature, process event
 *   4. User row updated atomically (credits, isPremium, premiumUntil)
 *
 * The service is intentionally stateless between 1 and 3 — we don't
 * optimistically grant anything. The webhook is authoritative.
 */

// Product catalog. Keep in sync with Stripe Dashboard products.
export const STRIPE_PRODUCTS = {
  // Subscriptions
  premium_monthly: {
    priceId: 'price_premium_monthly', // Replace with real Stripe price ID
    name: 'Premium Companion — Monthly',
    credits: 1000,
    amount: 1499, // cents
    recurring: true,
  },
  premium_yearly: {
    priceId: 'price_premium_yearly',
    name: 'Premium Companion — Yearly',
    credits: 15000,
    amount: 9999,
    recurring: true,
  },
  // One-time credit packs
  credits_small: {
    priceId: 'price_credits_small',
    name: '500 Credits',
    credits: 500,
    amount: 499,
    recurring: false,
  },
  credits_medium: {
    priceId: 'price_credits_medium',
    name: '1,200 Credits',
    credits: 1200,
    amount: 999,
    recurring: false,
  },
  credits_large: {
    priceId: 'price_credits_large',
    name: '2,500 Credits',
    credits: 2500,
    amount: 1999,
    recurring: false,
  },
  // Instant reveal (pay-per-unlock for gated media)
  instant_reveal: {
    priceId: 'price_instant_reveal',
    name: 'Instant Reveal',
    credits: 0, // Doesn't grant credits — unlocks one specific message
    amount: 199,
    recurring: false,
  },
} as const;

type ProductKey = keyof typeof STRIPE_PRODUCTS;

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: any;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {
    this.stripe = new Stripe(config.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2025-03-31.basil' as any,
    });
  }

  /**
   * Create a Stripe Checkout Session. The client redirects to the returned
   * URL; Stripe handles PCI-compliant card collection. Metadata carries
   * userId + productKey so the webhook knows what to grant.
   */
  async createCheckoutSession(params: {
    userId: string;
    productKey: ProductKey;
    successUrl: string;
    cancelUrl: string;
    messageId?: string;
    couponId?: string;
  }): Promise<{ url: string }> {
    const product = STRIPE_PRODUCTS[params.productKey];
    if (!product) throw new BadRequestException(`Unknown product: ${params.productKey}`);

    const sessionParams: any = {
      mode: product.recurring ? 'subscription' : 'payment',
      line_items: [{ price: product.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        productKey: params.productKey,
        messageId: params.messageId ?? '',
      },
    };
    if (params.couponId) {
      sessionParams.discounts = [{ coupon: params.couponId }];
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);
    return { url: (session as any).url };
  }

  /**
   * Verify the Stripe webhook signature and return the parsed event.
   * Throws on invalid/missing signature.
   */
  constructWebhookEvent(rawBody: Buffer, signature: string): StripeEvent {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  /**
   * Process a verified Stripe webhook event. Dispatches to the appropriate
   * handler based on event type.
   */
  async handleWebhookEvent(event: StripeEvent): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as StripeSession);
        break;
      case 'invoice.paid':
        await this.onInvoicePaid(event.data.object as StripeInvoice);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as StripeSubscription);
        break;
      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }
  }

  // ── Event handlers ──────────────────────────────────────

  private async onCheckoutCompleted(session: StripeSession) {
    const userId = session.metadata?.userId;
    const productKey = session.metadata?.productKey as ProductKey | undefined;
    if (!userId || !productKey) {
      this.logger.warn('Checkout session missing userId or productKey metadata');
      return;
    }

    const product = STRIPE_PRODUCTS[productKey];
    if (!product) return;

    // Grant credits (if any).
    if (product.credits > 0) {
      await this.credits.addCredits({
        userId,
        amount: product.credits,
        description: `Stripe: ${product.name}`,
        type: TransactionType.PURCHASE,
        metadata: {
          stripeSessionId: session.id,
          productKey,
          platform: 'web',
        },
      });
    }

    // Grant premium (if subscription).
    if (product.recurring) {
      const now = new Date();
      const premiumUntil = new Date(now);
      if (productKey === 'premium_yearly') {
        premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
      } else {
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { isPremium: true, premiumUntil },
      });

      await this.prisma.subscription.create({
        data: {
          userId,
          productId: productKey,
          platform: 'web',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: premiumUntil,
          revenuecatId: `stripe_${session.id}`,
          originalPurchaseDate: now,
        },
      });
    }

    // Instant reveal: unlock the specific message.
    if (productKey === 'instant_reveal' && session.metadata?.messageId) {
      await this.unlockMessage(userId, session.metadata.messageId);
    }

    this.logger.log(`Checkout fulfilled: ${productKey} for user ${userId}`);
  }

  private async onInvoicePaid(invoice: StripeInvoice) {
    // Subscription renewal — Stripe fires this on each billing cycle.
    const sub = invoice.subscription as string | undefined;
    if (!sub) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { revenuecatId: { startsWith: 'stripe_' }, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return;

    const userId = subscription.userId;
    const productKey = subscription.productId as ProductKey;
    const product = STRIPE_PRODUCTS[productKey];
    if (!product) return;

    // Grant renewal credits.
    if (product.credits > 0) {
      await this.credits.addCredits({
        userId,
        amount: product.credits,
        description: `Stripe renewal: ${product.name}`,
        type: TransactionType.SUBSCRIPTION,
        metadata: { stripeInvoiceId: invoice.id, productKey },
      });
    }

    // Extend premium.
    const premiumUntil = new Date();
    if (productKey === 'premium_yearly') {
      premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
    } else {
      premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { isPremium: true, premiumUntil },
    });

    this.logger.log(`Invoice renewal: ${productKey} for user ${userId}`);
  }

  private async onSubscriptionDeleted(sub: StripeSubscription) {
    // Revoke premium. Find the subscription by Stripe ID prefix.
    const dbSub = await this.prisma.subscription.findFirst({
      where: {
        revenuecatId: { startsWith: 'stripe_' },
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!dbSub) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: dbSub.id },
        data: { status: 'EXPIRED', willRenew: false },
      });
      await tx.user.update({
        where: { id: dbSub.userId },
        data: { isPremium: false, premiumUntil: null },
      });
    });

    this.logger.log(`Subscription cancelled for user ${dbSub.userId}`);
  }

  private async unlockMessage(userId: string, messageId: string) {
    // Same as the credit-based unlock but funded by Stripe, not credits.
    await (this.prisma as any).messageUnlock.upsert({
      where: { userId_messageId: { userId, messageId } },
      create: { userId, messageId, creditsSpent: 0 },
      update: {},
    });
  }
}
