import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CharactersService } from '../characters/characters.service';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private charactersService: CharactersService,
  ) {}

  async create(userId: string, dto: CreateConversationDto) {
    // Verify character exists
    await this.charactersService.findOne(dto.characterId);

    const conversation = await this.prisma.conversation.create({
      data: {
        userId,
        characterId: dto.characterId,
        title: dto.title,
        language: dto.language || 'en',
        nsfwEnabled: dto.nsfwEnabled || false,
      },
      include: {
        character: {
          include: {
            media: {
              where: { type: 'profile' },
              take: 1,
            },
          },
        },
      },
    });

    // Increment character conversation count
    await this.charactersService.incrementConversationCount(dto.characterId);

    return conversation;
  }

  async findAll(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        character: {
          include: {
            media: {
              where: { type: 'profile' },
              take: 1,
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        character: {
          include: {
            media: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  async delete(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    await this.prisma.conversation.delete({
      where: { id },
    });

    return { message: 'Conversation deleted successfully' };
  }

  async updateLastMessageTime(conversationId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        messageCount: {
          increment: 1,
        },
      },
    });
  }
}
