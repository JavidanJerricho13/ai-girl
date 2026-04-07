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
import { GenerateImageDto } from './dto/generate-image.dto';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(
    private readonly imageGenerationService: ImageGenerationService,
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
