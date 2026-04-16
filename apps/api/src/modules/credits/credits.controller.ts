import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from './credits.service';
import { CreditRewardsService } from './credit-rewards.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(
    private readonly credits: CreditsService,
    private readonly rewards: CreditRewardsService,
  ) {}

  @Get('balance')
  async getBalance(@Req() req: Request) {
    const user = (req as any).user;
    const balance = await this.credits.getBalance(user.id);
    return { balance };
  }

  /**
   * Claim today's login reward. Idempotent — re-calling the same day returns
   * `granted: false`. Frontend polls this on (app) mount; there's no harm
   * in calling it more than once per session.
   */
  @Post('claim-daily')
  @HttpCode(HttpStatus.OK)
  async claimDaily(@Req() req: Request) {
    const user = (req as any).user;
    return this.rewards.grantDailyReward(user.id);
  }

  /**
   * Scan the user's profile state and grant any unclaimed profile bonuses
   * they're eligible for (email verified, avatar added). Called on (app)
   * mount and after profile edits.
   */
  @Post('claim-profile-bonuses')
  @HttpCode(HttpStatus.OK)
  async claimProfileBonuses(@Req() req: Request) {
    const user = (req as any).user;
    return this.rewards.grantPendingProfileBonuses(user.id);
  }
}
