import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class MatchQuizDto {
  @IsInt()
  @Min(0)
  @Max(100)
  warmth!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  playfulness!: number;
}

@Controller('characters')
export class CharactersController {
  constructor(private charactersService: CharactersService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.charactersService.findAll(userId, category, search, limit, offset);
  }

  /**
   * Public matchmaker endpoint — takes the user's quiz-derived warmth /
   * playfulness scores and returns the closest public characters by
   * Euclidean distance. Unauthenticated so the onboarding quiz can run
   * before signup; read-only and character data is already public.
   */
  @Post('match')
  @HttpCode(HttpStatus.OK)
  async match(@Body() dto: MatchQuizDto) {
    return this.charactersService.findMatches(dto.warmth, dto.playfulness);
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommended(@Request() req: any) {
    return this.charactersService.findRecommended(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() dto: CreateCharacterDto) {
    return this.charactersService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req) {
    return this.charactersService.delete(id, req.user.id);
  }
}
