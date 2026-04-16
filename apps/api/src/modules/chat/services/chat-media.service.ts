import { Injectable, Logger } from '@nestjs/common';
import { FalService } from '../../../integrations/fal/fal.service';
import { ElevenLabsService } from '../../../integrations/elevenlabs/elevenlabs.service';
import { AzureTtsService } from '../../../integrations/azure-tts/azure-tts.service';
import { StorageService } from '../../../common/services/storage.service';
import { PrismaService } from '../../../common/services/prisma.service';

// ElevenLabs fallback voice if the character doesn't have one configured.
// Rachel — professional warm female voice, matches the default brand tone.
const DEFAULT_ELEVEN_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export interface InlineImageResult {
  url: string;
  jobId: string;
  width: number;
  height: number;
  prompt: string;
}

export interface InlineVoiceResult {
  url: string;
  jobId: string;
  prompt: string;
}

/**
 * Inline media generation for the chat flow. Both photo and voice go through
 * here; both record a GenerationJob (cost + moderation audit) but neither
 * deducts credits — the surrounding chat message already charged the user,
 * and the free/premium asymmetry is enforced via Message.isLocked + the
 * MessageUnlock ledger, not at generation time.
 *
 * Kept in the chat module (not media/) because it's a different product
 * surface: the media module creates reusable CharacterMedia rows for the
 * gallery; this service generates one-off media that only live on a single
 * Message row.
 */
@Injectable()
export class ChatMediaService {
  private readonly logger = new Logger(ChatMediaService.name);

  constructor(
    private readonly fal: FalService,
    private readonly elevenLabs: ElevenLabsService,
    private readonly azureTts: AzureTtsService,
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
        costCredits: 0, // Bundled with chat message; premium-gated via Message.isLocked.
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

  /**
   * Voice reply for the chat flow. Routes by conversation language (EN →
   * ElevenLabs, AZ → Azure) and reuses the character's configured voiceId
   * if set. The script is what the character would SAY aloud — usually the
   * same as the text reply, but we accept it as a separate param so the
   * tool-calling layer can request a shortened spoken version if desired.
   */
  async generateVoiceForChat(params: {
    userId: string;
    characterId: string;
    script: string;
    language?: 'en' | 'az';
  }): Promise<InlineVoiceResult> {
    const { userId, characterId, script, language = 'en' } = params;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { voiceId: true, voiceProvider: true },
    });

    const job = await this.prisma.generationJob.create({
      data: {
        userId,
        characterId,
        type: 'voice',
        prompt: script.slice(0, 500),
        status: 'PROCESSING',
        provider: language === 'az' ? 'azure' : 'elevenlabs',
        costCredits: 0,
        startedAt: new Date(),
      },
    });

    try {
      let buffer: Buffer;
      if (language === 'az') {
        buffer = await this.azureTts.synthesize({
          text: script,
          voice: character?.voiceId || undefined,
        });
      } else {
        const voiceId = character?.voiceId || DEFAULT_ELEVEN_VOICE_ID;
        buffer = await this.elevenLabs.synthesize({ text: script, voiceId });
      }

      const upload = await this.storage.uploadAudio(
        buffer,
        characterId,
        `chat-${Date.now()}.mp3`,
      );

      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          resultUrl: upload.url,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Chat voice ready for job ${job.id}: ${upload.url}`);

      return { url: upload.url, jobId: job.id, prompt: script };
    } catch (error: any) {
      await this.prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message ?? 'unknown',
          completedAt: new Date(),
        },
      });
      this.logger.error(`Chat voice failed for job ${job.id}: ${error?.message}`);
      throw error;
    }
  }
}
