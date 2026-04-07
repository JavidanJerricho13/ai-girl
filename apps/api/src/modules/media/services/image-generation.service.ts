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

      // 2. Get character and LoRA info
      const character = await this.prisma.character.findUnique({
        where: { id: params.characterId },
        include: {
          loraModels: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (!character) {
        throw new BadRequestException('Character not found');
      }

      // 3. Build enhanced prompt with LoRA trigger words
      let enhancedPrompt = params.prompt;
      let loraUrl: string | undefined;
      let loraWeight: number | undefined;

      if (character.loraModels.length > 0) {
        const lora = character.loraModels[0];
        const triggerWords = lora.triggerWords.join(', ');
        enhancedPrompt = `${triggerWords}, ${params.prompt}`;
        loraUrl = lora.modelUrl;
        loraWeight = lora.weight;
        
        this.logger.log(`Using LoRA: ${lora.name} with trigger words: ${triggerWords}`);
      }

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
            loraUrl,
            loraWeight,
            imageSize: params.imageSize,
            enableSafetyChecker: !user.nsfwEnabled,
          });

      // 6. Download and upload to R2
      this.logger.log(`Downloading image from fal.ai`);
      const imageBuffer = await this.falService.downloadImage(falResult.url);

      this.logger.log(`Uploading image to R2 storage`);
      const uploadResult = await this.storageService.uploadImage(
        imageBuffer,
        params.characterId,
        `${Date.now()}.png`,
      );

      // 7. Create CharacterMedia record
      const characterMedia = await this.prisma.characterMedia.create({
        data: {
          characterId: params.characterId,
          type: 'gallery',
          url: uploadResult.url,
          metadata: {
            width: falResult.width,
            height: falResult.height,
            prompt: enhancedPrompt,
            originalPrompt: params.prompt,
            imageSize: params.imageSize,
            provider: 'fal',
            model: params.usePro ? 'flux-pro' : 'flux-dev',
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
            resultUrl: uploadResult.url,
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
        imageUrl: uploadResult.url,
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
  async getGenerationHistory(userId: string, limit: number = 20) {
    const jobs = await this.prisma.generationJob.findMany({
      where: {
        userId,
        type: 'image',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return jobs;
  }
}
