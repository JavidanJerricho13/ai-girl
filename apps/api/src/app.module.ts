import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MemoryModule } from './modules/memory/memory.module';
import { MediaModule } from './modules/media/media.module';
import { CreditsModule } from './modules/credits/credits.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { EngagementModule } from './modules/engagement/engagement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Registers the @Cron decorator runtime. Discovery is global so
    // scheduler classes in any feature module are picked up.
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60_000,
      limit: 30,
    }]),
    AuthModule,
    UsersModule,
    CharactersModule,
    MemoryModule,
    ConversationsModule,
    MediaModule,
    CreditsModule,
    PaymentsModule,
    AdminModule,
    EngagementModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
