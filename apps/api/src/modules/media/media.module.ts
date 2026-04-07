import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { ImageGenerationService } from './services/image-generation.service';
import { TtsService } from './services/tts.service';
import { CreditsModule } from '../credits/credits.module';
import { FalService } from '../../integrations/fal/fal.service';
import { ElevenLabsService } from '../../integrations/elevenlabs/elevenlabs.service';
import { AzureTtsService } from '../../integrations/azure-tts/azure-tts.service';
import { StorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [ConfigModule, CreditsModule],
  controllers: [MediaController],
  providers: [
    ImageGenerationService,
    TtsService,
    FalService,
    ElevenLabsService,
    AzureTtsService,
    StorageService,
    PrismaService,
  ],
  exports: [ImageGenerationService, TtsService, FalService, StorageService],
})
export class MediaModule {}
