import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [CreditsService, PrismaService],
  exports: [CreditsService],
})
export class CreditsModule {}
