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

  /**
   * Pre-generate (or regenerate) a 3-second greeting voice clip for this
   * character. Uses the character's voiceId + first signaturePhrase (or
   * a generic "Hi, it's {name}."). Stored as a CharacterMedia row with
   * type='greeting'. Call this after creating/editing a character.
   */
  @Post('characters/:id/regenerate-greeting')
  async regenerateGreeting(@Param('id') id: string) {
    return this.adminService.regenerateGreeting(id);
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

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
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

  // ── Moderation ──────────────────────────────

  @Get('moderation/logs')
  async getModerationLogs(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('isViolation') isViolation?: string,
  ) {
    return this.adminService.getModerationLogs({
      page,
      limit,
      isViolation: isViolation === 'true' ? true : isViolation === 'false' ? false : undefined,
    });
  }

  @Patch('moderation/logs/:id')
  async reviewModerationLog(
    @Param('id') id: string,
    @Body('action') action: string,
    @Request() req,
  ) {
    return this.adminService.reviewModerationLog(id, action, req.user.id);
  }

  // ── Transactions ────────────────────────────

  @Get('transactions')
  async getTransactions(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.adminService.getTransactions({ search, type, page, limit });
  }
}
