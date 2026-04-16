import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EngagementService } from './engagement.service';

/**
 * Fires every hour and delegates to EngagementService. Thin on purpose so
 * the scheduling mechanism can be swapped (BullMQ, external cron) without
 * touching business logic. Safe to run on every api instance — the
 * database-level "< MAX_PROACTIVE_PER_DAY" check is the idempotency guard.
 *
 * Disable locally by setting ENGAGEMENT_SCHEDULER_DISABLED=true in .env.
 */
@Injectable()
export class EngagementScheduler {
  private readonly logger = new Logger(EngagementScheduler.name);

  constructor(private readonly engagement: EngagementService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourly() {
    if (process.env.ENGAGEMENT_SCHEDULER_DISABLED === 'true') {
      return;
    }

    try {
      const result = await this.engagement.runBatch();
      if (result.attempted > 0) {
        this.logger.log(
          `Proactive batch complete: attempted=${result.attempted} delivered=${result.delivered}`,
        );
      }
    } catch (err) {
      this.logger.error(`Proactive batch crashed: ${(err as Error).message}`);
    }
  }
}
