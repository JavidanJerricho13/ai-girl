import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../../common/services/prisma.service';
import { ElevenLabsService } from '../../integrations/elevenlabs/elevenlabs.service';
import { StorageService } from '../../common/services/storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, ElevenLabsService, StorageService],
})
export class AdminModule {}
