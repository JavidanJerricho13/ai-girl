import { Module } from '@nestjs/common';
import { RAGService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { SummarizationService } from './services/summarization.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [
    RAGService,
    EmbeddingService,
    SummarizationService,
    PrismaService,
  ],
  exports: [RAGService, EmbeddingService, SummarizationService],
})
export class MemoryModule {}
