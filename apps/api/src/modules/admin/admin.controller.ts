import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Request,
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

  // ── Characters ────────────────────────────────

  @Get('characters')
  async getCharacters(
    @Query('search') search?: string,
    @Query('isPublic') isPublic?: string,
    @Query('category') category?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.adminService.getCharacters({
      search,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      category,
      page,
      limit,
    });
  }

  @Get('characters/:id')
  async getCharacter(@Param('id') id: string) {
    return this.adminService.getCharacter(id);
  }

  @Post('characters')
  async createCharacter(@Request() req, @Body() data: any) {
    return this.adminService.createCharacter(req.user.id, data);
  }

  @Patch('characters/:id')
  async updateCharacter(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateCharacter(id, data);
  }

  @Delete('characters/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteCharacter(@Param('id') id: string) {
    return this.adminService.deleteCharacter(id);
  }

  @Patch('characters/:id/visibility')
  async updateCharacterVisibility(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
  ) {
    return this.adminService.updateCharacterVisibility(id, isPublic);
  }

  // ── Users ────────────────────────────────────

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
