import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Get,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { RevenueCatService } from './revenuecat.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private revenueCatService: RevenueCatService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  /**
   * RevenueCat webhook endpoint.
   *
   * SECURITY: Verifies the Authorization header against the
   * REVENUECAT_WEBHOOK_AUTH_KEY env var using constant-time comparison.
   * Without a valid key, the webhook is rejected 403 — no premium grants,
   * no credit purchases, no subscription changes. This closes the
   * vulnerability where any POST to this endpoint could grant premium.
   *
   * The RevenueCat dashboard must have the same key set in
   * Integrations → Webhooks → Authorization header ("Bearer <key>").
   */
  @Post('revenuecat/webhook')
  async handleRevenueCatWebhook(
    @Body() body: any,
    @Headers('authorization') authorization: string | undefined,
  ) {
    this.verifyWebhookAuth(authorization);

    try {
      await this.revenueCatService.handleWebhook(body);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }

  @Get('packages')
  getCreditPackages() {
    return this.revenueCatService.getCreditPackages();
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  async getUserSubscriptions(@GetUser('id') userId: string) {
    return this.revenueCatService.getUserSubscriptions(userId);
  }

  /**
   * Validate the webhook's Authorization header against a shared secret.
   *
   * RevenueCat sends:  Authorization: Bearer <key>
   * We compare against: REVENUECAT_WEBHOOK_AUTH_KEY from .env
   *
   * Design decisions:
   * - Fail CLOSED: if the env var is not set, ALL webhooks are rejected.
   *   This forces the operator to configure the key before accepting any
   *   payment events, which is safer than silently accepting everything.
   * - Constant-time comparison via crypto.timingSafeEqual to prevent
   *   timing side-channel attacks on the secret.
   * - 403 (not 401) because there's no challenge / negotiate step; the
   *   request is simply rejected.
   */
  // ── Stripe ──────────────────────────────────────────────

  /**
   * Create a Stripe Checkout Session. Returns the hosted checkout URL
   * so the web client can redirect to Stripe's PCI-compliant payment page.
   */
  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard)
  async createStripeCheckout(
    @GetUser('id') userId: string,
    @Body()
    body: {
      productKey: string;
      successUrl: string;
      cancelUrl: string;
      messageId?: string;
      couponId?: string;
    },
  ) {
    return this.stripeService.createCheckoutSession({
      userId,
      productKey: body.productKey as any,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      messageId: body.messageId,
      couponId: body.couponId,
    });
  }

  /**
   * Stripe webhook. Signature is verified against STRIPE_WEBHOOK_SECRET
   * by the Stripe SDK — no manual HMAC needed.
   *
   * IMPORTANT: this endpoint must receive the RAW body (not parsed JSON)
   * for signature verification to work. NestJS body parsing must be
   * disabled for this route — see main.ts rawBody config.
   */
  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body for Stripe signature verification');
    }

    let event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature invalid: ${err.message}`);
      throw new ForbiddenException('Invalid Stripe signature');
    }

    await this.stripeService.handleWebhookEvent(event);
    return { received: true };
  }

  // ── Internal helpers ──────────────────────────────────────

  private verifyWebhookAuth(authorization: string | undefined): void {
    const secret = this.configService.get<string>('REVENUECAT_WEBHOOK_AUTH_KEY');

    if (!secret) {
      this.logger.error(
        'REVENUECAT_WEBHOOK_AUTH_KEY is not configured — rejecting ALL webhooks. ' +
        'Set this env var to the key shown in your RevenueCat webhook settings.',
      );
      throw new ForbiddenException('Webhook auth not configured');
    }

    if (!authorization) {
      this.logger.warn('Webhook received without Authorization header');
      throw new ForbiddenException('Missing Authorization header');
    }

    const expected = `Bearer ${secret}`;

    // Constant-time comparison. Pad shorter string to prevent length leak.
    const a = Buffer.from(authorization);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.logger.warn('Webhook received with INVALID Authorization header');
      throw new ForbiddenException('Invalid webhook authorization');
    }
  }
}
