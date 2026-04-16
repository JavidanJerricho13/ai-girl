import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import { PrismaService } from '../../common/services/prisma.service';
import { GUEST_COOKIE_NAME } from '../auth/auth.cookies';
import { ChatService } from './chat.service';
import { ConversationsService } from '../conversations/conversations.service';

export class PreviewMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content!: string;

  @IsUUID()
  @IsOptional()
  characterId?: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;
}

const GUEST_MESSAGE_CAP = 5;

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationsService: ConversationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Landing-page preview endpoint. Non-streaming by design — the landing UI
   * wants a single reply, not a token stream. Requires a guest-id cookie
   * (issue it first via POST /auth/guest). Caps at GUEST_MESSAGE_CAP user
   * messages; beyond that returns 403 with an upgrade signal.
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Req() req: Request, @Body() dto: PreviewMessageDto) {
    const guestId = req.cookies?.[GUEST_COOKIE_NAME];
    if (!guestId) {
      throw new BadRequestException('Missing guest session — call /auth/guest first');
    }

    const guest = await this.prisma.user.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        isActive: true,
        credits: true,
        // @ts-ignore — field exists after `prisma generate` picks up the schema change
        isGuest: true,
        // @ts-ignore
        guestExpiresAt: true,
      } as any,
    });

    if (!guest || !guest.isActive || !(guest as any).isGuest) {
      throw new ForbiddenException('Guest session invalid');
    }

    const expiresAt = (guest as any).guestExpiresAt as Date | null;
    if (expiresAt && expiresAt < new Date()) {
      throw new ForbiddenException('Guest session expired');
    }

    // Enforce the 5-message cap explicitly — we don't rely solely on credits
    // in case a future credit tweak accidentally opens the floodgates.
    const userMessageCount = await this.prisma.message.count({
      where: { userId: guestId, role: 'user' },
    });

    if (userMessageCount >= GUEST_MESSAGE_CAP) {
      throw new ForbiddenException({
        code: 'GUEST_LIMIT_REACHED',
        messagesUsed: userMessageCount,
        limit: GUEST_MESSAGE_CAP,
        message: 'Preview limit reached — create an account to keep talking',
      });
    }

    // Reuse an existing guest conversation when the client passes one we own,
    // otherwise create a new temporary conversation.
    let conversationId = dto.conversationId;
    if (conversationId) {
      const existing = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { id: true, userId: true, characterId: true },
      });
      if (!existing || existing.userId !== guestId) {
        throw new ForbiddenException('Conversation does not belong to this guest');
      }
    } else {
      const characterId = await this.resolvePreviewCharacter(dto.characterId);
      const conversation = await this.conversationsService.create(guestId, {
        characterId,
        title: 'Landing preview',
      } as any);
      // Flag as temporary so cleanup jobs can sweep abandoned guest conversations.
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { ...({ isTemporary: true } as any) },
      });
      conversationId = conversation.id;
    }

    // Stream from chat.service but collect into a single string — simpler for
    // the landing page than piping SSE through a marketing component.
    let fullResponse = '';
    try {
      for await (const chunk of this.chatService.processMessage({
        conversationId: conversationId!,
        userId: guestId,
        content: dto.content,
      })) {
        fullResponse += chunk;
      }
    } catch (error: any) {
      // Turn insufficient-credits into the same GUEST_LIMIT_REACHED shape so
      // the frontend has one branch to handle.
      if (error?.message?.toLowerCase?.().includes('insufficient credits')) {
        throw new ForbiddenException({
          code: 'GUEST_LIMIT_REACHED',
          messagesUsed: userMessageCount + 1,
          limit: GUEST_MESSAGE_CAP,
          message: 'Preview limit reached — create an account to keep talking',
        });
      }
      throw error;
    }

    return {
      conversationId,
      reply: fullResponse,
      messagesUsed: userMessageCount + 1,
      messagesRemaining: Math.max(0, GUEST_MESSAGE_CAP - (userMessageCount + 1)),
      limit: GUEST_MESSAGE_CAP,
    };
  }

  private async resolvePreviewCharacter(requested?: string): Promise<string> {
    if (requested) {
      const char = await this.prisma.character.findUnique({
        where: { id: requested },
        select: { id: true, isPublic: true },
      });
      if (!char || !char.isPublic) {
        throw new NotFoundException('Character not available for preview');
      }
      return char.id;
    }
    const defaultChar = await this.prisma.character.findFirst({
      where: { isPublic: true, isPremium: false },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!defaultChar) {
      throw new NotFoundException('No public characters available for preview');
    }
    return defaultChar.id;
  }
}
