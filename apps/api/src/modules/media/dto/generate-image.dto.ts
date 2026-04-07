import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ImageSize {
  SQUARE_HD = 'square_hd',
  SQUARE = 'square',
  PORTRAIT_4_3 = 'portrait_4_3',
  PORTRAIT_16_9 = 'portrait_16_9',
  LANDSCAPE_4_3 = 'landscape_4_3',
  LANDSCAPE_16_9 = 'landscape_16_9',
}

export class GenerateImageDto {
  @ApiProperty({
    description: 'Text prompt for image generation',
    example: 'A beautiful portrait of a woman with long dark hair, smiling warmly',
  })
  @IsString()
  prompt: string;

  @ApiProperty({
    description: 'Character ID for applying LoRA model',
    example: 'uuid-character-id',
  })
  @IsString()
  characterId: string;

  @ApiPropertyOptional({
    description: 'Image aspect ratio',
    enum: ImageSize,
    default: ImageSize.SQUARE_HD,
  })
  @IsOptional()
  @IsEnum(ImageSize)
  imageSize?: ImageSize;

  @ApiPropertyOptional({
    description: 'Use premium Flux.1 Pro model (costs 2x credits)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  usePro?: boolean;
}
