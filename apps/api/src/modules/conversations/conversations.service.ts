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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Increment character conversation count
    await this.charactersService.incrementConversationCount(dto.characterId);

    // Auto-generate greeting message from character
    try {
      const character = conversation.character as any;
      const phrases: string[] = character?.signaturePhrases ?? [];
      const greeting = phrases[0]
        || `Hey! I'm ${character?.displayName || 'here'}. What's on your mind?`;

      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: greeting,
          language: dto.language || 'en',
        },
      });
    } catch {
      // Non-blocking — conversation still created even if greeting fails
    }

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
        user: { select: { timezone: true, nsfwEnabled: true, ageVerified: true } as any },
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

    // Collapse isLocked=false for any message this user has already unlocked
    // via MessageUnlock. Without this, paid-for media would re-lock on every
    // conversation reload — a terrible experience.
    const lockedIds = conversation.messages
      .filter((m: any) => m.isLocked)
      .map((m) => m.id);
    if (lockedIds.length) {
      const unlocks = await (this.prisma as any).messageUnlock.findMany({
        where: { userId, messageId: { in: lockedIds } },
        select: { messageId: true },
      });
      const unlockedSet = new Set<string>(unlocks.map((u: any) => u.messageId));
      conversation.messages = conversation.messages.map((m: any) =>
        unlockedSet.has(m.id) ? { ...m, isLocked: false } : m,
      );
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
