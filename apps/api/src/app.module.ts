import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CharactersModule } from './modules/characters/characters.module';
import { ConversationsModule } from './modules/conversations/conversations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    CharactersModule,
    ConversationsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
