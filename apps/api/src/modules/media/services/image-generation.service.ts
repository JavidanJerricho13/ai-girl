import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FalService, GenerateImageParams } from '../../../integrations/fal/fal.service';
import { StorageService } from '../../../common/services/storage.service';
import { PrismaService } from '../../../common/services/prisma.service';

export interface GenerateImageResult {
  imageUrl: string;
  thumbnailUrl?: string;
  characterMediaId: string;
  creditsUsed: number;
}

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);
  private readonly IMAGE_GENERATION_COST = 10; // Credits per image

  constructor(
    private falService: FalService,
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate an image for a character with LoRA support
   */
  async generateCharacterImage(params: {
    userId: string;
    characterId: string;
    prompt: string;
    imageSize?: GenerateImageParams['imageSize'];
    usePro?: boolean;
  }): Promise<GenerateImageResult> {
    try {
      // 1. Check user credits
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const costCredits = params.usePro ? this.IMAGE_GENERATION_COST * 2 : this.IMAGE_GENERATION_COST;

      if (user.credits < costCredits) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${costCredits}, Available: ${user.credits}`,
        );
      }

      // 2. Get character. LoRA loading is currently frozen — we rely on
      //    FAL base models + prompt engineering for visual consistency.
      //    The LoRAModel schema is preserved for future re-enablement.
      const character = await this.prisma.character.findUnique({
        where: { id: params.characterId },
      });

      if (!character) {
        throw new BadRequestException('Character not found');
      }

      const enhancedPrompt = params.prompt;

      // 4. Create generation job
      const job = await this.prisma.generationJob.create({
        data: {
          userId: params.userId,
          type: 'image',
          prompt: enhancedPrompt,
          characterId: params.characterId,
          status: 'PROCESSING',
          provider: 'fal',
          costCredits,
        },
      });

      // 5. Generate image with fal.ai
      this.logger.log(`Starting image generation for job ${job.id}`);

      const falResult = params.usePro
        ? await this.falService.generateImagePro({
            prompt: enhancedPrompt,
            imageSize: params.imageSize,
            enableSafetyChecker: !user.nsfwEnabled,
          })
        : await this.falService.generateImage({
            prompt: enhancedPrompt,
            imageSize: params.imageSize,
            enableSafetyChecker: !user.nsfwEnabled,
          });

      // 6. Download and upload to R2
      this.logger.log(`Downloading image from fal.ai`);
      const imageBuffer = await this.falService.downloadImage(falResult.url);

      this.logger.log(`Uploading optimized image to R2 storage`);
      const optimized = await this.storageService.uploadOptimizedImage(
        imageBuffer,
        params.characterId,
      );

      // 7. Create CharacterMedia record
      const characterMedia = await this.prisma.characterMedia.create({
        data: {
          characterId: params.characterId,
          type: 'gallery',
          url: optimized.fullUrl,
          thumbnailUrl: optimized.thumbUrl,
          metadata: {
            width: falResult.width,
            height: falResult.height,
            prompt: enhancedPrompt,
            originalPrompt: params.prompt,
            imageSize: params.imageSize,
            provider: 'fal',
            model: params.usePro ? 'flux-pro' : 'flux-dev',
            blurDataUrl: optimized.blurDataUrl,
          },
        },
      });

      // 8. Deduct credits and log transaction
      await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: params.userId },
          data: { credits: { decrement: costCredits } },
        });

        await tx.transaction.create({
          data: {
            userId: params.userId,
            type: 'SPEND',
            amount: -costCredits,
            balance: updatedUser.credits,
            description: 'Image generation',
            metadata: {
              characterId: params.characterId,
              jobId: job.id,
              mediaId: characterMedia.id,
            },
          },
        });

        // Update job status
        await tx.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'COMPLETED',
            resultUrl: optimized.fullUrl,
            completedAt: new Date(),
          },
        });

        // Update character stats
        await tx.characterStats.upsert({
          where: {
            characterId_date: {
              characterId: params.characterId,
              date: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          create: {
            characterId: params.characterId,
            imagesGenerated: 1,
          },
          update: {
            imagesGenerated: { increment: 1 },
          },
        });
      });

      this.logger.log(`Image generation completed successfully for job ${job.id}`);

      return {
        imageUrl: optimized.fullUrl,
        characterMediaId: characterMedia.id,
        creditsUsed: costCredits,
      };
    } catch (error) {
      this.logger.error(`Image generation failed: ${error.message}`, error.stack);
      
      // Update job status to failed if it exists
      // This is a best-effort attempt, don't fail if it doesn't work
      try {
        await this.prisma.generationJob.updateMany({
          where: {
            userId: params.userId,
            characterId: params.characterId,
            status: 'PROCESSING',
          },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
            completedAt: new Date(),
          },
        });
      } catch (updateError) {
        this.logger.warn(`Failed to update job status: ${updateError.message}`);
      }

      throw error;
    }
  }

  /**
   * Get generation job status
   */
  async getJobStatus(jobId: string, userId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: {
        id: jobId,
        userId,
      },
    });

    if (!job) {
      throw new BadRequestException('Job not found');
    }

    return job;
  }

  /**
   * Get user's generation history
   */
  async getGenerationHistory(userId: string, limit: number = 20, offset: number = 0, type?: string) {
    const where: any = { userId };
    if (type && (type === 'image' || type === 'voice')) {
      where.type = type;
    }

    const jobs = await this.prisma.generationJob.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 50),
      skip: offset,
    });

    return jobs;
  }
}
