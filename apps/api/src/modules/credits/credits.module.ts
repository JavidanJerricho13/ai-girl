import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditRewardsService } from './credit-rewards.service';
import { CreditsController } from './credits.controller';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService, CreditRewardsService, PrismaService],
  exports: [CreditsService, CreditRewardsService],
})
export class CreditsModule {}
