import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ElevenLabsService } from '../../integrations/elevenlabs/elevenlabs.service';
import { StorageService } from '../../common/services/storage.service';

const DEFAULT_ELEVEN_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private elevenLabs: ElevenLabsService,
    private storage: StorageService,
  ) {}

  // ── Characters ────────────────────────────────

  async getCharacters(params: {
    search?: string;
    isPublic?: boolean;
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

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
    return this.prisma.character.create({
      data: {
        ...data,
        createdBy: userId,
      },
      include: {
        media: { where: { type: 'profile' }, take: 1 },
      },
    });
  }

  async updateCharacter(id: string, data: any) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');

    const { id: _id, createdBy, createdAt, updatedAt, media, loraModels, creator, ...updateData } = data;

    return this.prisma.character.update({
      where: { id },
      data: updateData,
      include: {
        media: { where: { type: 'profile' }, take: 1 },
      },
    });
  }

  async deleteCharacter(id: string) {
    const character = await this.prisma.character.findUnique({ where: { id } });
    if (!character) throw new NotFoundException('Character not found');

    await this.prisma.character.delete({ where: { id } });
    return { message: 'Character deleted successfully' };
  }

  async updateCharacterVisibility(id: string, isPublic: boolean) {
    const character = await this.prisma.character.update({
      where: { id },
      data: { isPublic },
      select: { id: true, name: true, isPublic: true },
    });
    return character;
  }

  /**
   * Generate (or regenerate) a short greeting voice clip for a character.
   * Uses signaturePhrases[0] if set, else a generic "Hi, it's {name}."
   * Stored as CharacterMedia type='greeting'. Previous greeting row for
   * this character is replaced so each character has exactly one.
   */
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

    // Replace previous greeting if one exists.
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
    const user = await this.prisma.user.findUnique({
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
    });

    if (!user) throw new NotFoundException('User not found');

    // Get recent transactions
    const transactions = await this.prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return { ...user, recentTransactions: transactions };
  }

  async getUsers(params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

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

  async updateUserRole(id: string, role: string) {
    const validRoles = ['USER', 'ADMIN', 'MODERATOR'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, email: true, role: true },
    });

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    return user;
  }

  async addCredits(id: string, amount: number, description: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newBalance = user.credits + amount;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { credits: newBalance },
      }),
      this.prisma.transaction.create({
        data: {
          userId: id,
          type: 'EARN',
          amount,
          balance: newBalance,
          description: description || 'Admin credit grant',
        },
      }),
    ]);

    return { id, credits: newBalance };
  }

  // ── Moderation ────────────────────────────────

  async getModerationLogs(params: {
    page?: number;
    limit?: number;
    isViolation?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

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
    const log = await this.prisma.moderationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Moderation log not found');

    return this.prisma.moderationLog.update({
      where: { id },
      data: { action, reviewedBy: reviewerId },
    });
  }

  // ── Transactions ────────────────────────────

  async getTransactions(params: {
    search?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

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
}
