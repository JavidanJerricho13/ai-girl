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
  shynessBold?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  romanticPragmatic?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  playfulSerious?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  dominantSubmissive?: number;

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
