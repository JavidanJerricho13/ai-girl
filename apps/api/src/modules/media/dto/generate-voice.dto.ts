import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VoiceLanguage {
  ENGLISH = 'en',
  AZERBAIJANI = 'az',
}

export class GenerateVoiceDto {
  @ApiProperty({
    description: 'Text to convert to speech',
    example: 'Hello, how are you today?',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Language for voice synthesis',
    enum: VoiceLanguage,
    example: VoiceLanguage.ENGLISH,
  })
  @IsOptional()
  @IsEnum(VoiceLanguage)
  language?: VoiceLanguage;

  @ApiPropertyOptional({
    description: 'Character ID for using character-specific voice',
    example: 'uuid-character-id',
  })
  @IsOptional()
  @IsString()
  characterId?: string;
}
