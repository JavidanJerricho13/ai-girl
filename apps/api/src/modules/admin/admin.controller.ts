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
import { CharacterGeneratorService } from '../characters/services/character-generator.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private characterGenerator: CharacterGeneratorService,
  ) {}

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
    @Request() req,
  ) {
    return this.adminService.updateCharacter(id, data, req.user.id);
  }

  @Delete('characters/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteCharacter(@Param('id') id: string, @Request() req) {
    return this.adminService.deleteCharacter(id, req.user.id);
  }

  @Patch('characters/:id/visibility')
  async updateCharacterVisibility(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
    @Request() req,
  ) {
    return this.adminService.updateCharacterVisibility(id, isPublic, req.user.id);
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

  // ── Character Studio ─────────────────────────

  /** Step 1: LLM generates persona from archetype + keywords. */
  @Post('studio/generate-persona')
  async studioGeneratePersona(
    @Request() req,
    @Body() body: { archetype: string; keywords: string[] },
  ) {
    return this.characterGenerator.generatePersona({
      archetype: body.archetype,
      keywords: body.keywords,
      createdBy: req.user.id,
    });
  }

  /** Step 2: Create character row from generated persona. */
  @Post('studio/create-character')
  async studioCreateCharacter(
    @Request() req,
    @Body() body: any,
  ) {
    const id = await this.characterGenerator.createFromPersona(body, req.user.id);
    return { characterId: id };
  }

  /** Step 3: Generate candidate profile images. */
  @Post('studio/generate-candidates')
  async studioGenerateCandidates(
    @Body() body: { visualDescriptor: string; count?: number },
  ) {
    return this.characterGenerator.generateCandidateImages(
      body.visualDescriptor,
      body.count ?? 4,
    );
  }

  /** Step 4: Lock Visual DNA with the admin-selected candidate. */
  @Post('studio/lock-visual-dna')
  async studioLockVisualDNA(
    @Body() body: { characterId: string; seed: number; basePrompt: string; imageUrl: string },
  ) {
    await this.characterGenerator.lockVisualDNA(body);
    return { success: true };
  }

  /** Step 5: Auto-generate 12 gallery images from locked DNA. */
  @Post('studio/generate-gallery')
  async studioGenerateGallery(@Body() body: { characterId: string }) {
    return this.characterGenerator.generateGallery(body.characterId);
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
    @Request() req,
  ) {
    return this.adminService.updateUserRole(id, role, req.user.id);
  }

  @Patch('users/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req,
  ) {
    return this.adminService.updateUserStatus(id, isActive, req.user.id);
  }

  @Patch('users/:id/credits')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async addCredits(
    @Param('id') id: string,
    @Body('amount', ParseIntPipe) amount: number,
    @Body('description') description: string,
    @Request() req,
  ) {
    return this.adminService.addCredits(id, amount, description, req.user.id);
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

  // ── Analytics ────────────────────────────────

  @Get('analytics/overview')
  async getAnalyticsOverview() {
    return this.adminService.getAnalyticsOverview();
  }

  // ── Audit Logs ──────────────────────────────

  @Get('audit-logs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAuditLogs(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('action') action?: string,
    @Query('adminId') adminId?: string,
  ) {
    return this.adminService.getAuditLogs({ page, limit, action, adminId });
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
