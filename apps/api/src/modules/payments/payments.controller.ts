import { Controller, Post, Body, Headers, BadRequestException, UseGuards, Get } from '@nestjs/common';
import { RevenueCatService } from './revenuecat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private revenueCatService: RevenueCatService) {}

  /**
   * RevenueCat webhook endpoint
   * This endpoint receives events from RevenueCat about purchases, renewals, etc.
   */
  @Post('revenuecat/webhook')
  async handleRevenueCatWebhook(
    @Body() body: any,
    @Headers('x-revenuecat-signature') signature: string,
  ) {
    // TODO: Verify webhook signature for security
    // const isValid = this.verifyWebhookSignature(body, signature);
    // if (!isValid) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    try {
      await this.revenueCatService.handleWebhook(body);
      return { success: true };
    } catch (error) {
      throw new BadRequestException(`Webhook processing failed: ${error.message}`);
    }
  }

  /**
   * Get available credit packages
   */
  @Get('packages')
  getCreditPackages() {
    return this.revenueCatService.getCreditPackages();
  }

  /**
   * Get user's active subscriptions
   */
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  async getUserSubscriptions(@GetUser('id') userId: string) {
    return this.revenueCatService.getUserSubscriptions(userId);
  }

  /**
   * Verify webhook signature (implement based on RevenueCat docs)
   */
  private verifyWebhookSignature(body: any, signature: string): boolean {
    // Implement signature verification here
    // See: https://docs.revenuecat.com/docs/webhooks#verifying-webhook-signatures
    return true; // For now, accept all webhooks (NOT PRODUCTION READY)
  }
}
