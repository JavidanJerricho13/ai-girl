import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCharacterDto) {
    return this.prisma.character.create({
      data: {
        ...dto,
        createdBy: userId,
      },
      include: {
        media: {
          where: { type: 'profile' },
          take: 1,
        },
      },
    });
  }

  async findAll(userId?: string, category?: string) {
    const where: any = {
      OR: [
        { isPublic: true },
        ...(userId ? [{ createdBy: userId }] : []),
      ],
    };

    if (category) {
      where.category = {
        has: category,
      };
    }

    return this.prisma.character.findMany({
      where,
      include: {
        media: {
          where: { type: 'profile' },
          take: 1,
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
}
