import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ElevenLabsService } from '../../../integrations/elevenlabs/elevenlabs.service';
import { AzureTtsService } from '../../../integrations/azure-tts/azure-tts.service';
import { StorageService } from '../../../common/services/storage.service';
import { PrismaService } from '../../../common/services/prisma.service';

export interface SynthesizeVoiceParams {
  text: string;
  language: 'en' | 'az';
  characterId?: string;
  userId: string;
}

export interface SynthesizeVoiceResult {
  audioUrl: string;
  duration?: number;
  creditsUsed: number;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private readonly VOICE_GENERATION_COST = 3; // Credits per voice message

  constructor(
    private elevenLabsService: ElevenLabsService,
    private azureTtsService: AzureTtsService,
    private storageService: StorageService,
    private prisma: PrismaService,
  ) {}

  /**
   * Synthesize voice based on language
   * Routes to ElevenLabs for English, Azure for Azerbaijani
   */
  async synthesize(params: SynthesizeVoiceParams): Promise<SynthesizeVoiceResult> {
    try {
      // 1. Check user credits
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.credits < this.VOICE_GENERATION_COST) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${this.VOICE_GENERATION_COST}, Available: ${user.credits}`,
        );
      }

      // 2. Get character voice settings if characterId provided
      let voiceId: string | undefined;
      let voiceProvider: string | undefined;

      if (params.characterId) {
        const character = await this.prisma.character.findUnique({
          where: { id: params.characterId },
          select: { voiceId: true, voiceProvider: true },
        });

        if (character) {
          voiceId = character.voiceId;
          voiceProvider = character.voiceProvider;
        }
      }

      // 3. Generate voice based on language
      let audioBuffer: Buffer;
      const provider = params.language === 'az' ? 'azure' : 'elevenlabs';

      this.logger.log(`Generating voice with ${provider} for language: ${params.language}`);

      if (params.language === 'az') {
        // Use Azure for Azerbaijani
        audioBuffer = await this.azureTtsService.synthesize({
          text: params.text,
          voice: voiceId,
        });
      } else {
        // Use ElevenLabs for English
        if (!voiceId) {
          // Default ElevenLabs voice (Rachel - professional female voice)
          voiceId = '21m00Tcm4TlvDq8ikWAM';
        }
        audioBuffer = await this.elevenLabsService.synthesize({
          text: params.text,
          voiceId,
        });
      }

      // 4. Upload to R2 storage
      this.logger.log('Uploading audio to R2 storage');
      const uploadResult = await this.storageService.uploadAudio(
        audioBuffer,
        params.characterId,
        `${Date.now()}.mp3`,
      );

      // 5. Create generation job record
      const job = await this.prisma.generationJob.create({
        data: {
          userId: params.userId,
          type: 'voice',
          characterId: params.characterId,
          status: 'COMPLETED',
          provider,
          resultUrl: uploadResult.url,
          costCredits: this.VOICE_GENERATION_COST,
          completedAt: new Date(),
        },
      });

      // 6. Deduct credits and log transaction
      await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: params.userId },
          data: { credits: { decrement: this.VOICE_GENERATION_COST } },
        });

        await tx.transaction.create({
          data: {
            userId: params.userId,
            type: 'SPEND',
            amount: -this.VOICE_GENERATION_COST,
            balance: updatedUser.credits,
            description: 'Voice generation',
            metadata: {
              characterId: params.characterId,
              jobId: job.id,
              language: params.language,
              provider,
            },
          },
        });

        // Update character stats if characterId provided
        if (params.characterId) {
          await tx.characterStats.upsert({
            where: {
              characterId_date: {
                characterId: params.characterId,
                date: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
            create: {
              characterId: params.characterId,
              voiceMessages: 1,
            },
            update: {
              voiceMessages: { increment: 1 },
            },
          });
        }
      });

      this.logger.log(`Voice generation completed successfully`);

      return {
        audioUrl: uploadResult.url,
        creditsUsed: this.VOICE_GENERATION_COST,
      };
    } catch (error) {
      this.logger.error(`Voice synthesis failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Detect language from text
   * Simple detection based on character set
   */
  detectLanguage(text: string): 'en' | 'az' {
    // Azerbaijani-specific characters
    const azCharacters = /[əöüğışçӘÖÜĞIŞÇ]/;
    return azCharacters.test(text) ? 'az' : 'en';
  }

  /**
   * Get available voices
   */
  async getAvailableVoices() {
    const azureVoices = this.azureTtsService.getAzerbaijaniVoices();
    
    // Get ElevenLabs voices
    let elevenLabsVoices = [];
    try {
      const voices = await this.elevenLabsService.getVoices();
      elevenLabsVoices = voices.map((v) => ({
        id: v.id,
        name: v.name,
        language: 'en',
        provider: 'elevenlabs',
        category: v.category,
      }));
    } catch (error) {
      this.logger.warn('Failed to fetch ElevenLabs voices');
    }

    return {
      azure: azureVoices,
      elevenlabs: elevenLabsVoices,
    };
  }
}
