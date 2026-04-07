import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureTtsParams {
  text: string;
  voice?: string;
  rate?: number; // Speed: 0.5 to 2.0
  pitch?: number; // Pitch: -50% to +50%
}

@Injectable()
export class AzureTtsService {
  private readonly logger = new Logger(AzureTtsService.name);
  private readonly speechKey: string;
  private readonly serviceRegion: string;

  // Default Azerbaijani voices
  private readonly DEFAULT_VOICE_FEMALE = 'az-AZ-BanuNeural';
  private readonly DEFAULT_VOICE_MALE = 'az-AZ-BabekNeural';

  constructor(private config: ConfigService) {
    this.speechKey = config.get('AZURE_SPEECH_KEY');
    this.serviceRegion = config.get('AZURE_SPEECH_REGION');
    this.logger.log('Azure TTS service initialized');
  }

  /**
   * Synthesize speech using Azure Neural TTS
   * @param params TTS parameters
   * @returns Audio buffer (MP3 format)
   */
  async synthesize(params: AzureTtsParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const voice = params.voice || this.DEFAULT_VOICE_FEMALE;
        const rate = params.rate || 1.0;
        const pitch = params.pitch || 0;

        this.logger.log(`Synthesizing speech with Azure TTS for voice: ${voice}`);

        // Configure speech synthesis
        const speechConfig = sdk.SpeechConfig.fromSubscription(
          this.speechKey,
          this.serviceRegion,
        );

        // Set output format to MP3
        speechConfig.speechSynthesisOutputFormat =
          sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

        // Use null audio config to get the result in memory
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        // Build SSML for advanced control
        const ssml = this.buildSSML(params.text, voice, rate, pitch);

        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
              const audioBuffer = Buffer.from(result.audioData);
              this.logger.log(
                `Azure TTS synthesis completed: ${audioBuffer.length} bytes`,
              );
              synthesizer.close();
              resolve(audioBuffer);
            } else if (result.reason === sdk.ResultReason.Canceled) {
              const cancellation = sdk.CancellationDetails.fromResult(result);
              this.logger.error(
                `Azure TTS synthesis canceled: ${cancellation.reason} - ${cancellation.errorDetails}`,
              );
              synthesizer.close();
              reject(
                new Error(`Speech synthesis canceled: ${cancellation.errorDetails}`),
              );
            }
          },
          (error) => {
            this.logger.error(`Azure TTS synthesis error: ${error}`, error);
            synthesizer.close();
            reject(new Error(`Speech synthesis failed: ${error}`));
          },
        );
      } catch (error) {
        this.logger.error(`Azure TTS synthesis failed: ${error.message}`, error.stack);
        reject(new Error(`Voice synthesis failed: ${error.message}`));
      }
    });
  }

  /**
   * Build SSML (Speech Synthesis Markup Language) for advanced control
   */
  private buildSSML(
    text: string,
    voice: string,
    rate: number,
    pitch: number,
  ): string {
    // Calculate rate and pitch as percentages
    const ratePercent = `${Math.round((rate - 1) * 100)}%`;
    const pitchPercent = `${Math.round(pitch)}%`;

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="az-AZ">
        <voice name="${voice}">
          <prosody rate="${ratePercent}" pitch="${pitchPercent}">
            ${this.escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `;

    return ssml.trim();
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get available Azerbaijani voices
   */
  getAzerbaijaniVoices() {
    return [
      {
        id: this.DEFAULT_VOICE_FEMALE,
        name: 'Banu (Female)',
        language: 'az-AZ',
        gender: 'Female',
        description: 'Neural voice optimized for Azerbaijani language',
      },
      {
        id: this.DEFAULT_VOICE_MALE,
        name: 'Babek (Male)',
        language: 'az-AZ',
        gender: 'Male',
        description: 'Neural voice optimized for Azerbaijani language',
      },
    ];
  }
}
