import { Injectable, Logger } from '@nestjs/common';
import { FalService } from '../../../integrations/fal/fal.service';
import { StorageService } from '../../../common/services/storage.service';
import { PrismaService } from '../../../common/services/prisma.service';

export interface InlineImageResult {
  url: string;
  jobId: string;
  width: number;
  height: number;
  prompt: string;
}

/**
 * Inline image generation for the chat flow. Calls FAL base model with
 * prompt-only guidance — LoRA loading is currently frozen (see ADR /
 * cut-to-ship refactor). Records a GenerationJob for cost / moderation
 * tracking but does NOT deduct credits (the surrounding chat message
 * already charges the user). Credit gating for free vs. premium users
 * should be added here when the premium tier ships.
 *
 * Kept in the chat module (not media/) because it's a different product
 * surface: the media module's ImageGenerationService creates reusable
 * CharacterMedia rows for the gallery, whereas this service generates
 * one-off images that only live on a single Message row.
 */
@Injectable()
export class ChatMediaService {
  private readonly logger = new Logger(ChatMediaService.name);

  constructor(
    private readonly fal: FalService,
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async generateForChat(params: {
    userId: string;
    characterId: string;
    scene: string;
    mood?: string;
    nsfwAllowed?: boolean;
  }): Promise<InlineImageResult> {
    const { userId, characterId, scene, mood, nsfwAllowed } = params;

    const moodFragment = mood ? `${mood} mood, ` : '';
    const prompt = `${moodFragment}${scene}`.trim();

    const job = await this.prisma.generationJob.create({
      data: {
        userId,
        characterId,
        type: 'image',
        prompt,
        status: 'PROCESSING',
        provider: 'fal',
        costCredits: 0, // Bundled with chat message today; revisit for premium tiering.
        startedAt: new Date(),
      },
    });

    try {
      const fal = await this.fal.generateImage({
        prompt,
        imageSize: 'portrait_4_3',
        enableSafetyChecker: !nsfwAllowed,
      });

      const buffer = await this.fal.downloadImage(fal.url);
      const upload = await this.storage.uploadImage(
        buffer,
        characterId,
        `chat-${Date.now()}.png`,
      );

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          resultUrl: upload.url,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Chat image ready for job ${job.id}: ${upload.url}`);

      return {
        url: upload.url,
        jobId: job.id,
        width: fal.width,
        height: fal.height,
        prompt,
      };
    } catch (error: any) {
      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message ?? 'unknown',
          completedAt: new Date(),
        },
      });
      this.logger.error(`Chat image failed for job ${job.id}: ${error?.message}`);
      throw error;
    }
  }
}
