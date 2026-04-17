import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [ModerationService, PrismaService],
  exports: [ModerationService],
})
export class ModerationModule {}
