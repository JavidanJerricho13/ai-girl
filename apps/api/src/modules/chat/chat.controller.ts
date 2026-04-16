import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import { PrismaService } from '../../common/services/prisma.service';
import { GUEST_COOKIE_NAME } from '../auth/auth.cookies';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreditsService } from '../credits/credits.service';
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
    private readonly credits: CreditsService,
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

    // chat.service yields typed events; collapse them into a single
    // response object for the landing page. We skip the typing event here
    // because the marketing component runs its own client-side typing
    // animation — the natural pacing on the page already sells the feel.
    let fullResponse = '';
    let imageUrl: string | undefined;
    try {
      for await (const event of this.chatService.processMessage({
        conversationId: conversationId!,
        userId: guestId,
        content: dto.content,
      })) {
        if (event.kind === 'text') fullResponse += event.chunk;
        else if (event.kind === 'media' && event.mediaType === 'image') {
          imageUrl = event.url;
        }
        // typing / credits / complete events are ignored in the REST preview —
        // the marketing page drives its own typing feel and guests don't
        // see a real balance.
      }
    } catch (error: any) {
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
      imageUrl,
      messagesUsed: userMessageCount + 1,
      messagesRemaining: Math.max(0, GUEST_MESSAGE_CAP - (userMessageCount + 1)),
      limit: GUEST_MESSAGE_CAP,
    };
  }

  /**
   * Free-tier unlock for a gated media message. Charges 1 credit, records
   * the unlock in MessageUnlock (unique on [userId, messageId] so repeats
   * are no-ops), returns the unlocked URLs. Premium users skip this —
   * their messages are never isLocked in the first place.
   */
  @Post('messages/:id/unlock-media')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlockMedia(@Param('id') messageId: string, @Req() req: Request) {
    const user = (req as any).user;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        imageUrl: true,
        audioUrl: true,
        ...({ isLocked: true } as any),
        conversation: { select: { userId: true } },
      } as any,
    });

    if (!message) throw new NotFoundException('Message not found');
    const msg = message as any;
    if (msg.conversation?.userId !== user.id) {
      throw new ForbiddenException('Not your conversation');
    }
    if (!msg.isLocked) {
      // Already free — idempotent success so clients that click twice
      // (e.g. after an app resume) don't see errors.
      return {
        unlocked: true,
        imageUrl: msg.imageUrl,
        audioUrl: msg.audioUrl,
        balance: user.credits,
      };
    }

    // Short-circuit if the user already paid for this message previously.
    const existing = await (this.prisma as any).messageUnlock.findUnique({
      where: { userId_messageId: { userId: user.id, messageId } },
    });
    if (existing) {
      return {
        unlocked: true,
        imageUrl: msg.imageUrl,
        audioUrl: msg.audioUrl,
        balance: user.credits,
      };
    }

    // Deduct first (atomic balance check), then persist the unlock. If the
    // unlock insert fails for any reason the credit is already gone — we
    // accept that edge case in exchange for not double-charging on retries
    // (the @@unique constraint makes the insert itself idempotent).
    const { newBalance } = await this.credits.deductCredits({
      userId: user.id,
      amount: 1,
      description: 'Unlock media message',
      metadata: { messageId, conversationId: msg.conversationId },
    });

    await (this.prisma as any).messageUnlock.upsert({
      where: { userId_messageId: { userId: user.id, messageId } },
      create: { userId: user.id, messageId, creditsSpent: 1 },
      update: {},
    });

    return {
      unlocked: true,
      imageUrl: msg.imageUrl,
      audioUrl: msg.audioUrl,
      balance: newBalance,
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
