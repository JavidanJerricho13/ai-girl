import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req,
    @Body()
    data: {
      firstName?: string;
      lastName?: string;
      username?: string;
      avatar?: string;
      bio?: string;
      language?: string;
      timezone?: string;
    },
  ) {
    return this.usersService.update(req.user.id, data);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Get('credits')
  async getCredits(@Request() req) {
    return this.usersService.getUserCredits(req.user.id);
  }

  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.usersService.getTransactionHistory(req.user.id, limit);
  }
}
