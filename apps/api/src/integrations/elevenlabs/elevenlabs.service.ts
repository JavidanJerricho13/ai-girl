import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElevenLabsClient } from 'elevenlabs';

export interface ElevenLabsVoiceParams {
  text: string;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

@Injectable()
export class ElevenLabsService {
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly client: ElevenLabsClient;

  constructor(private config: ConfigService) {
    this.client = new ElevenLabsClient({
      apiKey: config.get('ELEVENLABS_API_KEY'),
    });
    this.logger.log('ElevenLabs service initialized');
  }

  /**
   * Synthesize speech using ElevenLabs API
   * @param params Voice synthesis parameters
   * @returns Audio buffer (MP3 format)
   */
  async synthesize(params: ElevenLabsVoiceParams): Promise<Buffer> {
    try {
      this.logger.log(`Synthesizing speech with ElevenLabs for voice: ${params.voiceId}`);

      const audioStream = await this.client.generate({
        voice: params.voiceId,
        text: params.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarityBoost ?? 0.75,
          style: params.style ?? 0.0,
          use_speaker_boost: params.useSpeakerBoost ?? true,
        },
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      this.logger.log(`ElevenLabs speech synthesized successfully: ${audioBuffer.length} bytes`);

      return audioBuffer;
    } catch (error) {
      this.logger.error(`ElevenLabs synthesis failed: ${error.message}`, error.stack);
      throw new Error(`Voice synthesis failed: ${error.message}`);
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getVoices() {
    try {
      const voices = await this.client.voices.getAll();
      return voices.voices.map((voice) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        labels: voice.labels,
        previewUrl: voice.preview_url,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch voices: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }

  /**
   * Get voice details
   */
  async getVoice(voiceId: string) {
    try {
      const voice = await this.client.voices.get(voiceId);
      return {
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        labels: voice.labels,
        previewUrl: voice.preview_url,
        settings: voice.settings,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch voice ${voiceId}: ${error.message}`, error.stack);
      throw new Error(`Failed to fetch voice: ${error.message}`);
    }
  }
}
