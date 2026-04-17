import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { CharacterGeneratorService } from './services/character-generator.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { FalService } from '../../integrations/fal/fal.service';
import { GroqService } from '../../integrations/groq/groq.service';
import { StorageService } from '../../common/services/storage.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [CharactersController],
  providers: [
    CharactersService,
    CharacterGeneratorService,
    PromptBuilderService,
    FalService,
    GroqService,
    StorageService,
    PrismaService,
  ],
  exports: [CharactersService, CharacterGeneratorService, PromptBuilderService],
})
export class CharactersModule {}
