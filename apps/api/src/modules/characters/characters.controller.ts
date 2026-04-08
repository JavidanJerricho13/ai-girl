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
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('characters')
export class CharactersController {
  constructor(private charactersService: CharactersService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.charactersService.findAll(userId, category);
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
