import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max, IsArray } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  warmth?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  playfulness?: number;

  @IsString()
  @IsOptional()
  voiceId?: string;

  @IsString()
  @IsOptional()
  voiceProvider?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  category?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
