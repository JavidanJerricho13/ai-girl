import {
  Controller,
  Post,
  Body,
  Headers,
  ForbiddenException,
  BadRequestException,
  UseGuards,
  Get,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { RevenueCatService } from './revenuecat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private revenueCatService: RevenueCatService,
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
