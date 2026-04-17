import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCharacterDto) {
    return this.prisma.character.create({
      // `as any` until prisma generate picks up the new persona fields.
      data: {
        ...dto,
        createdBy: userId,
      } as any,
      include: {
        media: {
          where: { type: 'profile' },
          take: 1,
        },
      },
    });
  }

  async findAll(userId?: string, category?: string, search?: string, limit: number = 20, offset: number = 0) {
    const where: any = {
      OR: [
        { isPublic: true, creator: { isShadowBanned: false } },
        ...(userId ? [{ createdBy: userId }] : []),
      ],
    };

    if (category) {
      where.category = {
        has: category,
      };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    return this.prisma.character.findMany({
      where,
      include: {
        media: {
          where: { type: { in: ['profile', 'greeting'] } },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        conversationCount: 'desc',
      },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  async findOne(id: string) {
    const character = await this.prisma.character.findUnique({
      where: { id },
      include: {
        media: true,
        loraModels: {
          where: { isActive: true },
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async update(id: string, userId: string, dto: UpdateCharacterDto) {
    // Check if user owns the character
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    if (character.createdBy !== userId && !character.isOfficial) {
      throw new ForbiddenException('You do not have permission to update this character');
    }

    return this.prisma.character.update({
      where: { id },
      data: dto,
      include: {
        media: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    // Check if user owns the character
    const character = await this.prisma.character.findUnique({
      where: { id },
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    if (character.createdBy !== userId && !character.isOfficial) {
      throw new ForbiddenException('You do not have permission to delete this character');
    }

    await this.prisma.character.delete({
      where: { id },
    });

    return { message: 'Character deleted successfully' };
  }

  async incrementConversationCount(characterId: string) {
    await this.prisma.character.update({
      where: { id: characterId },
      data: {
        conversationCount: {
          increment: 1,
        },
      },
    });
  }

  async incrementMessageCount(characterId: string) {
    await this.prisma.character.update({
      where: { id: characterId },
      data: {
        messageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Personalized discovery. Computes the user's implicit preference from
   * their conversation history (average warmth/playfulness of characters
   * they've chatted with) and returns the closest matches they haven't
   * tried yet. Falls back to popular characters if no history exists.
   */
  async findRecommended(userId: string) {
    // Compute average personality from characters the user has chatted with
    const prefs = await this.prisma.conversation.findMany({
      where: { userId },
      select: {
        character: {
          select: { warmth: true, playfulness: true },
        },
      },
      take: 20,
      orderBy: { lastMessageAt: 'desc' },
    });

    if (prefs.length === 0) {
      // No history — return popular characters
      return this.findAll(userId, undefined, undefined, 6, 0);
    }

    const avgWarmth = Math.round(
      prefs.reduce((sum, p) => sum + p.character.warmth, 0) / prefs.length,
    );
    const avgPlayfulness = Math.round(
      prefs.reduce((sum, p) => sum + p.character.playfulness, 0) / prefs.length,
    );

    return this.findMatches(avgWarmth, avgPlayfulness);
  }

  /**
   * Onboarding matchmaker. Returns the top 3 public characters ranked by
   * Euclidean distance from the requested (warmth, playfulness) point.
   *
   * Distance is computed in Postgres so we don't pull every character into
   * memory to sort — Prisma can't express this declaratively. We also
   * precompute `matchScore` (1 - distance / MAX_DIAG, scaled to 0..100)
   * so the frontend can show "92% match" without reinventing the math.
   *
   * MAX_DIAG = √(100² + 100²) ≈ 141.42 (the 2-axis diagonal). Shrinking
   * that to 0..100 gives a percentage the user can parse at a glance.
   */
  async findMatches(warmth: number, playfulness: number) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        displayName: string;
        description: string;
        warmth: number;
        playfulness: number;
        isPremium: boolean;
        avatarUrl: string | null;
        distance: number;
      }>
    >`
      SELECT
        c."id",
        c."name",
        c."displayName",
        c."description",
        c."warmth",
        c."playfulness",
        c."isPremium",
        (
          SELECT cm."url"
          FROM "CharacterMedia" cm
          WHERE cm."characterId" = c."id" AND cm."type" = 'profile'
          ORDER BY cm."order" ASC, cm."createdAt" ASC
          LIMIT 1
        ) AS "avatarUrl",
        sqrt(
          power(c."warmth"      - ${warmth}, 2) +
          power(c."playfulness" - ${playfulness}, 2)
        ) AS "distance"
      FROM "Character" c
      WHERE c."isPublic" = true
      ORDER BY "distance" ASC
      LIMIT 3
    `;

    const MAX_DIAG = Math.sqrt(100 * 100 + 100 * 100);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayName: row.displayName,
      description: row.description,
      warmth: row.warmth,
      playfulness: row.playfulness,
      isPremium: row.isPremium,
      avatarUrl: row.avatarUrl,
      // Round to int — showing "87.3% match" reads worse than "87%".
      matchScore: Math.round((1 - Number(row.distance) / MAX_DIAG) * 100),
    }));
  }
}
