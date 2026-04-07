import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MemoryModule } from './modules/memory/memory.module';
import { MediaModule } from './modules/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    CharactersModule,
    MemoryModule,
    ConversationsModule,
    MediaModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
