import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { RevenueCatService } from './revenuecat.service';
import { CreditsModule } from '../credits/credits.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [CreditsModule],
  controllers: [PaymentsController],
  providers: [RevenueCatService, PrismaService],
  exports: [RevenueCatService],
})
export class PaymentsModule {}
