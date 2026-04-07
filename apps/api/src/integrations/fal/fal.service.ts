import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fal from '@fal-ai/serverless-client';

export interface FalImageResult {
  url: string;
  width: number;
  height: number;
  contentType: string;
}

export interface GenerateImageParams {
  prompt: string;
  loraUrl?: string;
  loraWeight?: number;
  imageSize?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  numInferenceSteps?: number;
  guidanceScale?: number;
  enableSafetyChecker?: boolean;
  seed?: number;
}

@Injectable()
export class FalService {
  private readonly logger = new Logger(FalService.name);

  constructor(private config: ConfigService) {
    // Configure fal.ai client
    fal.config({
      credentials: config.get('FAL_KEY'),
    });
    this.logger.log('Fal.ai service initialized');
  }

  /**
   * Generate an image using Flux.1 Dev model with optional LoRA
   */
  async generateImage(params: GenerateImageParams): Promise<FalImageResult> {
    try {
      this.logger.log(`Generating image with prompt: ${params.prompt.substring(0, 50)}...`);

      const input: any = {
        prompt: params.prompt,
        image_size: params.imageSize || 'square_hd',
        num_inference_steps: params.numInferenceSteps || 28,
        guidance_scale: params.guidanceScale || 3.5,
        num_images: 1,
        enable_safety_checker: params.enableSafetyChecker !== false,
        output_format: 'png',
      };

      // Add LoRA if provided
      if (params.loraUrl) {
        input.loras = [
          {
            path: params.loraUrl,
            scale: params.loraWeight || 0.8,
          },
        ];
      }

      // Add seed for reproducibility if provided
      if (params.seed !== undefined) {
        input.seed = params.seed;
      }

      const result: any = await fal.subscribe('fal-ai/flux-lora', {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            this.logger.log(`Image generation in progress: ${update.logs?.join('\n')}`);
          }
        },
      });

      const image = result.images[0];
      
      this.logger.log(`Image generated successfully: ${image.url}`);

      return {
        url: image.url,
        width: image.width,
        height: image.height,
        contentType: image.content_type || 'image/png',
      };
    } catch (error) {
      this.logger.error(`Failed to generate image: ${error.message}`, error.stack);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image with Flux.1 Pro for higher quality (premium feature)
   */
  async generateImagePro(params: GenerateImageParams): Promise<FalImageResult> {
    try {
      this.logger.log(`Generating PRO image with prompt: ${params.prompt.substring(0, 50)}...`);

      const result: any = await fal.subscribe('fal-ai/flux-pro', {
        input: {
          prompt: params.prompt,
          image_size: params.imageSize || 'square_hd',
          num_inference_steps: params.numInferenceSteps || 28,
          guidance_scale: params.guidanceScale || 3.5,
          num_images: 1,
          enable_safety_checker: params.enableSafetyChecker !== false,
          output_format: 'png',
          seed: params.seed,
        },
        logs: true,
      });

      const image = result.images[0];
      
      this.logger.log(`PRO image generated successfully: ${image.url}`);

      return {
        url: image.url,
        width: image.width,
        height: image.height,
        contentType: image.content_type || 'image/png',
      };
    } catch (error) {
      this.logger.error(`Failed to generate PRO image: ${error.message}`, error.stack);
      throw new Error(`PRO image generation failed: ${error.message}`);
    }
  }

  /**
   * Download image from fal.ai URL
   */
  async downloadImage(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.error(`Failed to download image from ${url}: ${error.message}`, error.stack);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }
}
