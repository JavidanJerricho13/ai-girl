import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
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
        language: true,
        timezone: true,
        credits: true,
        isPremium: true,
        premiumUntil: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
    bio?: string;
    language?: string;
    timezone?: string;
  }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        language: true,
        timezone: true,
        credits: true,
        isPremium: true,
        role: true,
      },
    });
  }

  async getUserStats(userId: string) {
    const [conversations, messages, images] = await Promise.all([
      this.prisma.conversation.count({ where: { userId } }),
      this.prisma.message.count({
        where: { conversation: { userId }, role: 'user' },
      }),
      this.prisma.generationJob.count({
        where: { userId, type: 'image', status: 'COMPLETED' },
      }),
    ]);
    return { conversations, messages, images };
  }

  async getUserCredits(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        credits: true,
        isPremium: true,
        premiumUntil: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getTransactionHistory(userId: string, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
