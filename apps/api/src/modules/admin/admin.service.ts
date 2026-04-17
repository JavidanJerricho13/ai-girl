import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ElevenLabsService } from '../../integrations/elevenlabs/elevenlabs.service';
import { StorageService } from '../../common/services/storage.service';

const DEFAULT_ELEVEN_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

const MAX_PAGE_LIMIT = 100;
const MAX_CREDIT_AMOUNT = 1_000_000;
const VALID_MODERATION_ACTIONS = ['allowed', 'blocked', 'flagged'];

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private elevenLabs: ElevenLabsService,
    private storage: StorageService,
  ) {}

  // ── Audit Logging ────────────────────────────

  private async logAction(params: {
    adminId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    before?: any;
    after?: any;
    description?: string;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId: params.adminId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          before: params.before ?? undefined,
          after: params.after ?? undefined,
          description: params.description,
          ipAddress: params.ipAddress,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  private safePagination(page?: number, limit?: number) {
    const safePage = Math.max(1, Math.min(page ?? 1, 1_000_000));
    const safeLimit = Math.max(1, Math.min(limit ?? 20, MAX_PAGE_LIMIT));
    const skip = (safePage - 1) * safeLimit;
    return { page: safePage, limit: safeLimit, skip };
  }

  // ── Characters ────────────────────────────────

  async getCharacters(params: {
    search?: string;
    isPublic?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = this.safePagination(params.page, params.limit);

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { displayName: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.isPublic !== undefined) {
      where.isPublic = params.isPublic;
    }

    if (params.category) {
      where.category = { has: params.category };
    }

    const [characters, total] = await Promise.all([
      this.prisma.character.findMany({
        where,
        include: {
          media: { where: { type: 'profile' }, take: 1 },
          creator: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.character.count({ where }),
    ]);

    return {
      data: characters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCharacter(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        media: true,
        loraModels: true,
        creator: { select: { id: true, username: true, email: true } },
      },
    });
    if (!character) throw new NotFoundException('Character not found');
    return character;
  }

  async createCharacter(userId: string, data: any) {
    const character = await this.prisma.character.create({
      data: {
        ...data,
        createdBy: userId,
      },
      include: {
        media: { where: { type: 'profile' }, take: 1 },
      },
    });

    await this.logAction({
      adminId: userId,
      action: 'CREATE_CHARACTER',
      resourceType: 'CHARACTER',
      resourceId: character.id,
      after: { name: character.name, displayName: character.displayName },
    });

    return character;
  }

  async updateCharacter(id: string, data: any, adminId?: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');

    const { id: _id, createdBy, createdAt, updatedAt, media, loraModels, creator, ...updateData } = data;

    const updated = await this.prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        media: { where: { type: 'profile' }, take: 1 },
      },
    });

    if (adminId) {
      await this.logAction({
        adminId,
        action: 'UPDATE_CHARACTER',
        resourceType: 'CHARACTER',
        resourceId: id,
        before: { name: character.name, isPublic: character.isPublic },
        after: { name: updated.name, isPublic: updated.isPublic },
      });
    }

    return updated;
  }

  async deleteCharacter(id: string, adminId: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');

    await this.prisma.character.delete({ where: { id } });

    await this.logAction({
      adminId,
      action: 'DELETE_CHARACTER',
      resourceType: 'CHARACTER',
      resourceId: id,
      before: { name: character.name, displayName: character.displayName, isPublic: character.isPublic },
      description: `Deleted character "${character.displayName}"`,
    });

    return { message: 'Character deleted successfully' };
  }

  async updateCharacterVisibility(id: string, isPublic: boolean, adminId: string) {
    const before = await this.prisma.character.findUnique({
      where: { id },
      select: { isPublic: true, name: true },
    });

    const character = await this.prisma.character.update({
      where: { id },
      data: { isPublic },
      select: { id: true, name: true, isPublic: true },
    });

    await this.logAction({
      adminId,
      action: 'TOGGLE_VISIBILITY',
      resourceType: 'CHARACTER',
      resourceId: id,
      before: { isPublic: before?.isPublic },
      after: { isPublic },
      description: `${isPublic ? 'Published' : 'Unpublished'} character "${character.name}"`,
    });

    return character;
  }

  async regenerateGreeting(characterId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: {
        id: true,
        displayName: true,
        voiceId: true,
        signaturePhrases: true,
      } as any,
    }) as any;

    if (!character) throw new NotFoundException('Character not found');

    const phrases: string[] = character.signaturePhrases ?? [];
    const script = phrases[0] || `Hi, it's ${character.displayName}.`;
    const voiceId = character.voiceId || DEFAULT_ELEVEN_VOICE_ID;

    this.logger.log(`Generating greeting for ${character.displayName}: "${script}"`);

    const audioBuffer = await this.elevenLabs.synthesize({
      text: script,
      voiceId,
    });

    const upload = await this.storage.uploadAudio(
      audioBuffer,
      characterId,
      `greeting-${Date.now()}.mp3`,
    );

    await this.prisma.characterMedia.deleteMany({
      where: { characterId, type: 'greeting' },
    });

    const media = await this.prisma.characterMedia.create({
      data: {
        characterId,
        type: 'greeting',
        url: upload.url,
        metadata: {
          script,
          voiceId,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Greeting ready for ${character.displayName}: ${upload.url}`);
    return { url: media.url, mediaId: media.id };
  }

  // ── Users ────────────────────────────────────

  async getUser(id: string) {
    const [user, transactions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          role: true,
          credits: true,
          isPremium: true,
          premiumUntil: true,
          isActive: true,
          isVerified: true,
          language: true,
          nsfwEnabled: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              conversations: true,
              messages: true,
              characters: true,
              transactions: true,
            },
          },
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId: id },
        select: {
          id: true,
          type: true,
          amount: true,
          balance: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return { ...user, recentTransactions: transactions };
  }

  async getUsers(params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = this.safePagination(params.page, params.limit);

    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          credits: true,
          isPremium: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserRole(id: string, role: string, adminId: string) {
    const validRoles = ['USER', 'ADMIN', 'MODERATOR'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true, email: true },
    });
    if (!before) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, email: true, role: true },
    });

    await this.logAction({
      adminId,
      action: 'CHANGE_ROLE',
      resourceType: 'USER',
      resourceId: id,
      before: { role: before.role },
      after: { role },
      description: `Changed ${before.email} role: ${before.role} → ${role}`,
    });

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean, adminId: string) {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { isActive: true, email: true },
    });
    if (!before) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    await this.logAction({
      adminId,
      action: 'CHANGE_STATUS',
      resourceType: 'USER',
      resourceId: id,
      before: { isActive: before.isActive },
      after: { isActive },
      description: `${isActive ? 'Unbanned' : 'Banned'} user ${before.email}`,
    });

    return user;
  }

  async addCredits(id: string, amount: number, description: string, adminId: string) {
    if (amount === 0) throw new BadRequestException('Amount cannot be zero');
    if (Math.abs(amount) > MAX_CREDIT_AMOUNT) {
      throw new BadRequestException(`Amount exceeds maximum of ${MAX_CREDIT_AMOUNT}`);
    }
    if (!description || description.trim().length === 0) {
      throw new BadRequestException('Description is required for audit trail');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newBalance = Math.max(0, user.credits + amount);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { credits: newBalance },
      }),
      this.prisma.transaction.create({
        data: {
          userId: id,
          type: amount > 0 ? 'EARN' : 'SPEND',
          amount,
          balance: newBalance,
          description: description.trim(),
        },
      }),
    ]);

    await this.logAction({
      adminId,
      action: 'GRANT_CREDITS',
      resourceType: 'USER',
      resourceId: id,
      before: { credits: user.credits },
      after: { credits: newBalance },
      description: `${amount > 0 ? 'Granted' : 'Deducted'} ${Math.abs(amount)} credits. Reason: ${description.trim()}`,
    });

    return { id, credits: newBalance };
  }

  // ── Moderation ────────────────────────────────

  async getModerationLogs(params: {
    page?: number;
    limit?: number;
    isViolation?: boolean;
  }) {
    const { page, limit, skip } = this.safePagination(params.page, params.limit);

    const where: any = {};
    if (params.isViolation !== undefined) {
      where.isViolation = params.isViolation;
    }

    const [logs, total] = await Promise.all([
      this.prisma.moderationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reviewModerationLog(id: string, action: string, reviewerId: string) {
    if (!VALID_MODERATION_ACTIONS.includes(action)) {
      throw new BadRequestException(
        `Invalid action. Must be one of: ${VALID_MODERATION_ACTIONS.join(', ')}`,
      );
    }

    const log = await this.prisma.moderationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Moderation log not found');

    const updated = await this.prisma.moderationLog.update({
      where: { id },
      data: { action, reviewedBy: reviewerId },
    });

    await this.logAction({
      adminId: reviewerId,
      action: 'REVIEW_MODERATION',
      resourceType: 'MODERATION_LOG',
      resourceId: id,
      before: { action: log.action },
      after: { action },
      description: `Moderation decision: ${action} (content: ${log.contentType}/${log.contentId})`,
    });

    return updated;
  }

  // ── Transactions ────────────────────────────

  async getTransactions(params: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip } = this.safePagination(params.page, params.limit);

    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.search) {
      where.user = {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { username: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, username: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Analytics ─────────────────────────────────

  async getAnalyticsOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      totalMessages,
      messagesToday,
      totalRevenue,
      activeConversations,
      totalImages,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isGuest: false } }),
      this.prisma.user.count({ where: { isGuest: false, createdAt: { gte: today } } }),
      this.prisma.message.count(),
      this.prisma.message.count({ where: { createdAt: { gte: today } } }),
      this.prisma.transaction.aggregate({
        where: { type: 'PURCHASE' },
        _sum: { amount: true },
      }),
      this.prisma.conversation.count({ where: { lastMessageAt: { gte: today } } }),
      this.prisma.generationJob.count({ where: { type: 'image', status: 'COMPLETED' } }),
    ]);

    return {
      totalUsers,
      newUsersToday,
      totalMessages,
      messagesToday,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      activeConversations,
      totalImages,
    };
  }

  // ── Audit Logs Viewer ─────────────────────────

  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
  }) {
    const { page, limit, skip } = this.safePagination(params.page, params.limit);

    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.adminId) where.adminId = params.adminId;

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: { select: { id: true, email: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
