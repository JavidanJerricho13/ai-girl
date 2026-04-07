import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageGenerationService } from './services/image-generation.service';
import { TtsService } from './services/tts.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { GenerateVoiceDto } from './dto/generate-voice.dto';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(
    private readonly imageGenerationService: ImageGenerationService,
    private readonly ttsService: TtsService,
  ) {}

  @Post('generate/image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate an image using AI (costs 10 credits)' })
  @ApiResponse({
    status: 200,
    description: 'Image generated successfully',
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string' },
        characterMediaId: { type: 'string' },
        creditsUsed: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient credits' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateImage(@Request() req, @Body() dto: GenerateImageDto) {
    return this.imageGenerationService.generateCharacterImage({
      userId: req.user.userId,
      characterId: dto.characterId,
      prompt: dto.prompt,
      imageSize: dto.imageSize,
      usePro: dto.usePro,
    });
  }

  @Post('generate/voice')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate voice/TTS audio (costs 3 credits)' })
  @ApiResponse({
    status: 200,
    description: 'Voice generated successfully',
    schema: {
      type: 'object',
      properties: {
        audioUrl: { type: 'string' },
        creditsUsed: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient credits' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateVoice(@Request() req, @Body() dto: GenerateVoiceDto) {
    const language = dto.language || this.ttsService.detectLanguage(dto.text);
    
    return this.ttsService.synthesize({
      text: dto.text,
      language,
      characterId: dto.characterId,
      userId: req.user.userId,
    });
  }

  @Get('voices')
  @ApiOperation({ summary: 'Get available voices' })
  @ApiResponse({ status: 200, description: 'Voices retrieved' })
  async getVoices() {
    return this.ttsService.getAvailableVoices();
  }

  @Get('generate/jobs/:jobId')
  @ApiOperation({ summary: 'Get generation job status' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Request() req, @Param('jobId') jobId: string) {
    return this.imageGenerationService.getJobStatus(jobId, req.user.userId);
  }

  @Get('generate/history')
  @ApiOperation({ summary: 'Get generation history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getHistory(@Request() req) {
    return this.imageGenerationService.getGenerationHistory(req.user.userId);
  }
}
