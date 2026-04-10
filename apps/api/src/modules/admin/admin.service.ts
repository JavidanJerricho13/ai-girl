import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

  // ── Users ────────────────────────────────────

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
}
