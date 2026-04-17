import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { RevenueCatService } from './revenuecat.service';
import { StripeService } from './stripe.service';
import { CreditsModule } from '../credits/credits.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [ConfigModule, CreditsModule],
  controllers: [PaymentsController],
  providers: [RevenueCatService, StripeService, PrismaService],
  exports: [RevenueCatService, StripeService],
})
export class PaymentsModule {}
