import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [CharactersController],
  providers: [CharactersService, PrismaService],
  exports: [CharactersService],
})
export class CharactersModule {}
