import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { ChatModule } from '../chat/chat.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { EngagementService } from './engagement.service';
import { EngagementScheduler } from './engagement.scheduler';
import { PushService } from './push.service';

/**
 * Proactive messaging surface. Depends on ChatModule for the ModelRouter
 * (LLM) and ConversationsModule for the gateway (socket push) — both wrapped
 * in forwardRef so future circular imports (gateway → engagement for testing
 * hooks) stay easy.
 *
 * Scheduler is registered as a regular provider; ScheduleModule.forRoot() in
 * AppModule is what actually wires @Cron decorators to the event loop.
 */
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ChatModule),
    forwardRef(() => ConversationsModule),
  ],
  providers: [EngagementService, EngagementScheduler, PushService, PrismaService],
  exports: [EngagementService],
})
export class EngagementModule {}
