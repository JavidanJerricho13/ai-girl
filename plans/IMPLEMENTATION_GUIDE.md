# Implementation Guide - Ethereal AI Companion Platform

## Overview

This guide provides a step-by-step approach to building the Ethereal platform. Follow phases sequentially to ensure stable incremental progress.

---

## Phase 1: Foundation Setup (Days 1-3)

### Step 1.1: Initialize Monorepo

```bash
# Create project directory
mkdir ethereal && cd ethereal

# Initialize root package.json
npm init -y

# Install Turborepo
npm install turbo --save-dev

# Create workspace structure
mkdir -p apps/api apps/ai-service apps/web apps/mobile
mkdir -p packages/database packages/types packages/ui packages/utils
mkdir -p infrastructure/docker scripts docs
```

**Create [`package.json`](package.json)**:
```json
{
  "name": "ethereal-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "db:generate": "cd packages/database && prisma generate",
    "db:migrate": "cd packages/database && prisma migrate dev",
    "db:push": "cd packages/database && prisma db push",
    "db:seed": "cd packages/database && ts-node prisma/seed.ts"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.0.0",
    "eslint": "^8.50.0",
    "@typescript-eslint/eslint-plugin": "^6.7.0",
    "@typescript-eslint/parser": "^6.7.0"
  }
}
```

**Create [`turbo.json`](turbo.json)**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### Step 1.2: Set Up Database Package

```bash
cd packages/database
npm init -y
npm install prisma @prisma/client
npm install -D typescript ts-node @types/node
npx prisma init
```

**See [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) for complete Prisma schema.**

### Step 1.3: Create Shared Types Package

```bash
cd packages/types
npm init -y
npm install -D typescript
npx tsc --init
```

**Create [`packages/types/src/index.ts`](packages/types/src/index.ts)**:
```typescript
// Export all types
export * from './api';
export * from './models';
export * from './enums';
export * from './websocket';
```

### Step 1.4: Set Up Docker Compose

**Create [`docker-compose.yml`](docker-compose.yml)** in root:
```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: ethereal-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ethereal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ethereal-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Start infrastructure**:
```bash
docker-compose up -d
```

### Step 1.5: Run Initial Migration

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

---

## Phase 2: Backend API Gateway (Days 4-7)

### Step 2.1: Initialize NestJS API

```bash
cd apps/api
npm init -y
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install passport passport-jwt bcrypt
npm install class-validator class-transformer
npm install @prisma/client
npm install -D @nestjs/cli typescript @types/node @types/express
```

**Create [`apps/api/src/main.ts`](apps/api/src/main.ts)**:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Ethereal API')
    .setDescription('AI Companion Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📚 Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
```

### Step 2.2: Create Core Modules

**Auth Module** ([`apps/api/src/modules/auth/auth.module.ts`](apps/api/src/modules/auth/auth.module.ts)):
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
```

**Create all modules**:
- `auth` - Authentication & authorization
- `users` - User management
- `characters` - Character CRUD
- `conversations` - Conversation management
- `chat` - Message handling
- `memory` - RAG memory system
- `media` - Image/video/audio generation
- `moderation` - Content filtering
- `payments` - Credits & subscriptions
- `discover` - Feed API

### Step 2.3: Implement Database Service

**Create [`apps/api/src/common/services/prisma.service.ts`](apps/api/src/common/services/prisma.service.ts)**:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### Step 2.4: Set Up Environment Configuration

**Create [`apps/api/.env.example`](apps/api/.env.example)**:
```bash
# Database
DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/ethereal

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AI Services
GROQ_API_KEY=
OPENAI_API_KEY=
FAL_KEY=
ELEVENLABS_API_KEY=
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=

# Vector Database
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX=

# Feature Flags
ENABLE_NSFW=false
ENABLE_VIDEO_CALLS=false
ENABLE_MODERATION=true

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# App
PORT=3001
NODE_ENV=development
```

---

## Phase 3: AI Integration Services (Days 8-12)

### Step 3.1: Text Generation Service

**Create [`apps/api/src/integrations/groq/groq.service.ts`](apps/api/src/integrations/groq/groq.service.ts)**:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private client: Groq;

  constructor(private config: ConfigService) {
    this.client = new Groq({
      apiKey: config.get('GROQ_API_KEY'),
    });
  }

  async *streamResponse(params: {
    systemPrompt: string;
    userMessage: string;
  }) {
    const stream = await this.client.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}
```

**Create [`apps/api/src/modules/chat/services/model-router.service.ts`](apps/api/src/modules/chat/services/model-router.service.ts)**:
```typescript
import { Injectable } from '@nestjs/common';
import { GroqService } from '../../../integrations/groq/groq.service';
import { OpenAIService } from '../../../integrations/openai/openai.service';

@Injectable()
export class ModelRouterService {
  constructor(
    private groqService: GroqService,
    private openAIService: OpenAIService,
  ) {}

  async detectLanguage(text: string): Promise<'en' | 'az'> {
    // Simple detection - enhance with language detection library
    const azCharacters = /[əöüğışçӘÖÜĞIŞÇ]/;
    return azCharacters.test(text) ? 'az' : 'en';
  }

  async *generateResponse(params: {
    prompt: string;
    systemPrompt: string;
  }) {
    const language = await this.detectLanguage(params.prompt);

    if (language === 'az') {
      // Use GPT-4o-mini for Azerbaijani
      yield* this.openAIService.streamResponse(params);
    } else {
      // Use Groq for English
      yield* this.groqService.streamResponse(params);
    }
  }
}
```

### Step 3.2: RAG Memory Service

**Create [`apps/api/src/modules/memory/services/rag.service.ts`](apps/api/src/modules/memory/services/rag.service.ts)**:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { EmbeddingService } from './embedding.service';
import { PineconeProvider } from '../providers/pinecone.provider';

@Injectable()
export class RAGService {
  constructor(
    private prisma: PrismaService,
    private embedding: EmbeddingService,
    private pinecone: PineconeProvider,
  ) {}

  async getContext(conversationId: string): Promise<string> {
    // 1. Get recent messages (short-term memory)
    const recentMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 2. Get relevant long-term memories
    const lastMessage = recentMessages[0];
    const queryEmbedding = await this.embedding.embed(lastMessage.content);
    const relevantMemories = await this.pinecone.query({
      vector: queryEmbedding,
      topK: 3,
      filter: { conversationId },
    });

    // 3. Combine contexts
    const shortTermContext = recentMessages
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const longTermContext = relevantMemories
      .map((m) => m.metadata.summary)
      .join('\n\n');

    return `
Previous Context:
${longTermContext}

Recent Conversation:
${shortTermContext}
    `.trim();
  }

  async storeMemory(conversationId: string, messageIds: string[]) {
    // Get messages to summarize
    const messages = await this.prisma.message.findMany({
      where: { id: { in: messageIds } },
      orderBy: { createdAt: 'asc' },
    });

    // Create summary (use LLM)
    const summary = await this.summarize(messages);

    // Generate embedding
    const embedding = await this.embedding.embed(summary);

    // Store in vector DB
    await this.pinecone.upsert({
      id: `memory-${Date.now()}`,
      values: embedding,
      metadata: {
        conversationId,
        summary,
        messageRange: `${messages[0].createdAt}-${messages[messages.length - 1].createdAt}`,
      },
    });

    // Store summary in database
    await this.prisma.memorySummary.create({
      data: {
        conversationId,
        summary,
        messageRange: messageIds.join(','),
      },
    });
  }

  private async summarize(messages: any[]): Promise<string> {
    // Use LLM to create concise summary
    // Implementation depends on your text generation service
    return 'Summary of conversation...';
  }
}
```

### Step 3.3: Image Generation Service

**Create [`apps/api/src/integrations/fal/fal.service.ts`](apps/api/src/integrations/fal/fal.service.ts)**:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fal from '@fal-ai/serverless-client';

@Injectable()
export class FalService {
  constructor(private config: ConfigService) {
    fal.config({
      credentials: config.get('FAL_KEY'),
    });
  }

  async generateImage(params: {
    prompt: string;
    loraUrl?: string;
    loraWeight?: number;
    imageSize?: 'square' | 'portrait' | 'landscape';
    enableSafety?: boolean;
  }) {
    const result = await fal.subscribe('fal-ai/flux-lora', {
      input: {
        prompt: params.prompt,
        image_size: params.imageSize || 'square',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        ...(params.loraUrl && {
          loras: [
            {
              path: params.loraUrl,
              scale: params.loraWeight || 0.8,
            },
          ],
        }),
        enable_safety_checker: params.enableSafety !== false,
      },
    });

    return result.images[0];
  }
}
```

### Step 3.4: TTS Service

**Create [`apps/api/src/modules/media/services/tts.service.ts`](apps/api/src/modules/media/services/tts.service.ts)**:
```typescript
import { Injectable } from '@nestjs/common';
import { ElevenLabsService } from '../../../integrations/elevenlabs/elevenlabs.service';
import { AzureTTSService } from '../../../integrations/azure-tts/azure-tts.service';

@Injectable()
export class TTSService {
  constructor(
    private elevenlabs: ElevenLabsService,
    private azureTTS: AzureTTSService,
  ) {}

  async synthesize(params: {
    text: string;
    language: 'en' | 'az';
    voiceId: string;
    emotion?: string;
  }): Promise<Buffer> {
    if (params.language === 'az') {
      return this.azureTTS.synthesize({
        text: params.text,
        voice: params.voiceId || 'az-AZ-BanuNeural',
      });
    } else {
      return this.elevenlabs.synthesize({
        text: params.text,
        voiceId: params.voiceId,
      });
    }
  }
}
```

---

## Phase 4: WebSocket & Real-time (Days 13-14)

### Step 4.1: Set Up Socket.io Gateway

```bash
cd apps/api
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Create [`apps/api/src/modules/conversations/conversations.gateway.ts`](apps/api/src/modules/conversations/conversations.gateway.ts)**:
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ConversationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join-conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(data.conversationId);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    // Process message
    const response = this.chatService.processMessage(data);

    // Stream response
    for await (const chunk of response) {
      this.server.to(data.conversationId).emit('message-chunk', {
        chunk,
      });
    }

    this.server.to(data.conversationId).emit('message-complete');
  }
}
```

---

## Phase 5: Frontend - Web Application (Days 15-20)

### Step 5.1: Initialize Next.js

```bash
cd apps/web
npx create-next-app@latest . --typescript --tailwind --app
npm install zustand socket.io-client axios @tanstack/react-query
npm install framer-motion lucide-react
```

### Step 5.2: Create API Client

**Create [`apps/web/src/lib/api-client.ts`](apps/web/src/lib/api-client.ts)**:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Step 5.3: Create Chat Interface

**Create [`apps/web/src/app/chat/[conversationId]/page.tsx`](apps/web/src/app/chat/[conversationId]/page.tsx)**:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join-conversation', { conversationId });

    newSocket.on('message-chunk', (data) => {
      // Handle streaming message
    });

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId]);

  return (
    <div className="flex flex-col h-screen">
      <ChatWindow messages={messages} />
      <MessageInput socket={socket} conversationId={conversationId} />
    </div>
  );
}
```

---

## Phase 6: Frontend - Mobile Application (Days 21-25)

### Step 6.1: Initialize React Native with Expo

```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
npm install @react-navigation/native @react-navigation/stack
npm install axios socket.io-client
npm install react-native-purchases  # RevenueCat
```

### Step 6.2: Set Up Navigation

**Create [`apps/mobile/src/navigation/RootNavigator.tsx`](apps/mobile/src/navigation/RootNavigator.tsx)**:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createStackNavigator();

export function RootNavigator() {
  const isAuthenticated = false; // Get from auth state

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Phase 7: Python AI Service (Days 26-28)

### Step 7.1: Initialize FastAPI

```bash
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn
pip install sentence-transformers pinecone-client
pip install langchain openai
```

**Create [`apps/ai-service/src/main.py`](apps/ai-service/src/main.py)**:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import embeddings, rag

app = FastAPI(title="Ethereal AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embeddings.router, prefix="/embeddings")
app.include_router(rag.router, prefix="/rag")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 7.2: Implement Embedding Service

**Create [`apps/ai-service/src/services/embedding_service.py`](apps/ai-service/src/services/embedding_service.py)**:
```python
from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def embed(self, text: str) -> List[float]:
        embedding = self.model.encode(text)
        return embedding.tolist()
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

embedding_service = EmbeddingService()
```

---

## Phase 8: Testing & Optimization (Days 29-30)

### Step 8.1: Write Unit Tests

**Backend tests** ([`apps/api/test/unit/`](apps/api/test/unit/)):
```typescript
import { Test } from '@nestjs/testing';
import { ChatService } from '../src/modules/chat/chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ChatService],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process message correctly', async () => {
    // Test implementation
  });
});
```

### Step 8.2: Performance Testing

- Test text generation latency (<200ms)
- Test image generation throughput
- Load test WebSocket connections
- Database query optimization

### Step 8.3: Security Audit

- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] API key rotation
- [ ] Content moderation active

---

## Implementation Checklist

### Backend Core
- [ ] NestJS API gateway initialized
- [ ] Prisma schema configured
- [ ] Authentication & JWT implemented
- [ ] User CRUD operations
- [ ] Character CRUD operations
- [ ] Conversation management
- [ ] WebSocket gateway for real-time chat

### AI Integration
- [ ] Groq API integration (English text)
- [ ] OpenAI API integration (Azerbaijani text)
- [ ] Model routing logic
- [ ] RAG memory pipeline
- [ ] Embedding service
- [ ] Pinecone/pgvector setup
- [ ] fal.ai image generation
- [ ] LoRA model management
- [ ] ElevenLabs TTS (English)
- [ ] Azure TTS (Azerbaijani)
- [ ] Content moderation (Llama-Guard)

### Real-time Features
- [ ] Socket.io server
- [ ] Message streaming
- [ ] Video call state machine
- [ ] LiveKit integration

### Monetization
- [ ] Credit system
- [ ] Transaction ledger
- [ ] Subscription management
- [ ] RevenueCat webhooks

### Frontend Web
- [ ] Next.js app initialized
- [ ] Authentication flow
- [ ] Character discovery feed
- [ ] Chat interface
- [ ] Image viewer
- [ ] Video call player
- [ ] Settings page

### Frontend Mobile
- [ ] React Native app initialized
- [ ] Navigation setup
- [ ] Authentication screens
- [ ] Chat screen
- [ ] Character list/detail
- [ ] RevenueCat SDK integration
- [ ] In-app purchases

### Python AI Service
- [ ] FastAPI initialized
- [ ] Embedding endpoint
- [ ] RAG retrieval endpoint
- [ ] Model loading optimized

### Infrastructure
- [ ] Docker Compose setup
- [ ] PostgreSQL with pgvector
- [ ] Redis cache
- [ ] Environment variables configured
- [ ] API documentation (Swagger)

---

## Development Commands Reference

```bash
# Start all services
npm run dev

# Start individual services
cd apps/api && npm run dev
cd apps/web && npm run dev
cd apps/mobile && npm start
cd apps/ai-service && uvicorn src.main:app --reload

# Database operations
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:push         # Push schema changes
npm run db:seed         # Seed database

# Docker operations
docker-compose up -d    # Start infrastructure
docker-compose down     # Stop infrastructure
docker-compose logs -f  # View logs

# Testing
npm run test            # Run all tests
npm run test:e2e        # End-to-end tests

# Building
npm run build           # Build all apps
turbo run build --filter=api  # Build specific app
```

---

## Troubleshooting

### Common Issues

**Database connection failed**:
```bash
# Check if PostgreSQL is running
docker-compose ps
docker-compose logs postgres

# Regenerate Prisma client
cd packages/database && npx prisma generate
```

**API not responding**:
```bash
# Check environment variables
cat apps/api/.env

# Restart API service
cd apps/api && npm run dev
```

**WebSocket connection issues**:
```bash
# Check CORS configuration in main.ts
# Verify WebSocket URL in frontend
```

---

## Next Steps After Implementation

1. **Deployment**: Containerize services and deploy to cloud
2. **Monitoring**: Set up logging (Winston) and metrics (Prometheus)
3. **CI/CD**: GitHub Actions for automated testing and deployment
4. **Analytics**: Track user behavior and model performance
5. **Scaling**: Kubernetes deployment for horizontal scaling

---

## Support & Resources

- **NestJS Docs**: [docs.nestjs.com](https://docs.nestjs.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
- **Expo Docs**: [docs.expo.dev](https://docs.expo.dev)
- **FastAPI Docs**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)

See **[`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)** for complete database design.
