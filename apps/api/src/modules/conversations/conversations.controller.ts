import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.conversationsService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.conversationsService.findOne(id, req.user.id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(req.user.id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.conversationsService.delete(id, req.user.id);
  }
}
