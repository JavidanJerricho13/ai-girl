import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { EmbeddingService } from './embedding.service';
import { SummarizationService } from './summarization.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RAGService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
    private summarizationService: SummarizationService,
  ) {}

  /**
   * Get context for a conversation by combining short-term and long-term memory
   */
  async getContext(conversationId: string, currentMessage?: string): Promise<string> {
    // 1. Get recent messages (short-term memory - last 10 messages)
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // 2. Get relevant long-term memories using vector similarity search
    let relevantMemories: string[] = [];
    
    if (currentMessage) {
      try {
        // Generate embedding for the current message
        const queryEmbedding = await this.embeddingService.embed(currentMessage);
        
        // Use pgvector to find similar memories
        // Note: This uses raw SQL because Prisma doesn't yet have full vector support
        const memories = await this.prisma.$queryRaw<Array<{ summary: string; similarity: number }>>`
          SELECT 
            summary,
            1 - (embedding <=> ${Prisma.sql`CAST(${JSON.stringify(queryEmbedding)} AS vector)`}) as similarity
          FROM "MemorySummary"
          WHERE "conversationId" = ${conversationId}
            AND embedding IS NOT NULL
          ORDER BY embedding <=> ${Prisma.sql`CAST(${JSON.stringify(queryEmbedding)} AS vector)`}
          LIMIT 3
        `;
        
        relevantMemories = memories
          .filter((m) => m.similarity > 0.7) // Only include relevant memories
          .map((m) => m.summary);
      } catch (error) {
        console.error('Error querying vector memories:', error);
        // Fallback: get most recent memory summaries
        const fallbackMemories = await this.prisma.memorySummary.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: { summary: true },
        });
        relevantMemories = fallbackMemories.map((m) => m.summary);
      }
    }

    // 3. Format short-term context (reverse to chronological order)
    const shortTermContext = recentMessages
      .reverse()
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // 4. Format long-term context
    const longTermContext = relevantMemories.length > 0
      ? `Previous Context:\n${relevantMemories.join('\n\n')}`
      : '';

    // 5. Combine contexts
    if (longTermContext && shortTermContext) {
      return `${longTermContext}\n\nRecent Conversation:\n${shortTermContext}`;
    } else if (shortTermContext) {
      return `Recent Conversation:\n${shortTermContext}`;
    } else if (longTermContext) {
      return longTermContext;
    }

    return '';
  }

  /**
   * Store memory summary with vector embedding
   */
  async storeMemory(conversationId: string, messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) {
      return;
    }

    // Get messages to summarize
    const messages = await this.prisma.message.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    if (messages.length === 0) {
      return;
    }

    try {
      // Create summary
      const summary = await this.summarizationService.summarize(messages);

      // Generate embedding for the summary
      const embedding = await this.embeddingService.embed(summary);

      // Store in database with vector embedding
      await this.prisma.$executeRaw`
        INSERT INTO "MemorySummary" (id, "conversationId", summary, "messageRange", embedding, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${conversationId},
          ${summary},
          ${messageIds.join(',')},
          ${Prisma.sql`CAST(${JSON.stringify(embedding)} AS vector)`},
          NOW()
        )
      `;

      console.log(`✅ Stored memory for conversation ${conversationId}`);
    } catch (error) {
      console.error('Error storing memory:', error);
      // Store without embedding as fallback
      await this.prisma.memorySummary.create({
        data: {
          conversationId,
          summary: await this.summarizationService.summarize(messages),
          messageRange: messageIds.join(','),
        },
      });
    }
  }

  /**
   * Automatically store memory after certain number of messages
   */
  async autoStoreMemory(conversationId: string): Promise<void> {
    // Get unsummarized messages
    const lastMemory = await this.prisma.memorySummary.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, messageRange: true },
    });

    const whereClause = lastMemory
      ? { conversationId, createdAt: { gt: lastMemory.createdAt } }
      : { conversationId };

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true },
    });

    // Count message pairs (user + assistant)
    let pairCount = 0;
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        pairCount++;
      }
    }

    // Store memory if we have 5 or more unsummarized pairs
    if (pairCount >= 5) {
      const messageIds = messages.map((m) => m.id);
      await this.storeMemory(conversationId, messageIds);
    }
  }

  /**
   * Get all memories for a conversation
   */
  async getMemories(conversationId: string): Promise<Array<{
    id: string;
    summary: string;
    createdAt: Date;
  }>> {
    return this.prisma.memorySummary.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        summary: true,
        createdAt: true,
      },
    });
  }

  /**
   * Pick one random MemorySummary for a conversation. Used for "memory
   * receipts" — the character referencing a specific past detail every
   * ~20 messages to build intimacy.
   */
  async getRandomMemorySummary(conversationId: string): Promise<string | null> {
    const all = await this.prisma.memorySummary.findMany({
      where: { conversationId },
      select: { summary: true },
    });
    if (!all.length) return null;
    const pick = all[Math.floor(Math.random() * all.length)];
    return pick.summary;
  }

  /**
   * Delete all memories for a conversation
   */
  async deleteMemories(conversationId: string): Promise<void> {
    await this.prisma.memorySummary.deleteMany({
      where: { conversationId },
    });
  }
}
