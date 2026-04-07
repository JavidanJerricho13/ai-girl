import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { ImageGenerationService } from './services/image-generation.service';
import { FalService } from '../../integrations/fal/fal.service';
import { StorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [
    ImageGenerationService,
    FalService,
    StorageService,
    PrismaService,
  ],
  exports: [ImageGenerationService, FalService, StorageService],
})
export class MediaModule {}
