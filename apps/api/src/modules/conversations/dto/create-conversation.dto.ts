import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  characterId: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  nsfwEnabled?: boolean;
}
