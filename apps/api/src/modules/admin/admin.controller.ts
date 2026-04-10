import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok', message: 'Admin access granted' };
  }

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.adminService.getUsers({ search, role, page, limit });
  }

  @Patch('users/:id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.updateUserStatus(id, isActive);
  }

  @Patch('users/:id/credits')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addCredits(
    @Param('id') id: string,
    @Body('amount', ParseIntPipe) amount: number,
    @Body('description') description: string,
  ) {
    return this.adminService.addCredits(id, amount, description);
  }
}
