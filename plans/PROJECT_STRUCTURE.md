# Project Structure - Ethereal AI Companion Platform

## Overview

Ethereal uses a **monorepo** structure managed by **Turborepo** to share code between web, mobile, and backend services.

## Root Structure

```
ethereal/
├── apps/
│   ├── api/                    # NestJS API Gateway
│   ├── ai-service/             # FastAPI Python ML service
│   ├── web/                    # Next.js Web App
│   └── mobile/                 # React Native (Expo)
├── packages/
│   ├── database/               # Prisma schema & client
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared React components
│   └── utils/                  # Shared utilities
├── services/
│   ├── chat/                   # Chat microservice
│   ├── character/              # Character management
│   ├── media/                  # Image/video/audio processing
│   └── payment/                # Billing & credits
├── infrastructure/
│   ├── docker/                 # Dockerfiles
│   ├── k8s/                    # Kubernetes manifests
│   └── terraform/              # Infrastructure as Code
├── docs/                       # Documentation
├── scripts/                    # Build & deployment scripts
├── .github/                    # CI/CD workflows
├── docker-compose.yml          # Local development
├── turbo.json                  # Turborepo config
├── package.json                # Root package.json
└── README.md
```

---

## Backend Services

### 1. API Gateway ([`apps/api/`](apps/api))

NestJS application serving as the main API entry point.

```
apps/api/
├── src/
│   ├── main.ts                 # Bootstrap application
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration
│   │   ├── env.validation.ts
│   │   └── app.config.ts
│   ├── common/                 # Shared utilities
│   │   ├── decorators/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── rate-limit.guard.ts
│   │   │   └── moderation.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   ├── characters/
│   │   │   ├── characters.module.ts
│   │   │   ├── characters.controller.ts
│   │   │   ├── characters.service.ts
│   │   │   └── dto/
│   │   │       ├── create-character.dto.ts
│   │   │       └── update-character.dto.ts
│   │   ├── conversations/
│   │   │   ├── conversations.module.ts
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── conversations.gateway.ts    # WebSocket
│   │   │   └── dto/
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   └── services/
│   │   │       ├── text-generation.service.ts
│   │   │       ├── model-router.service.ts
│   │   │       └── streaming.service.ts
│   │   ├── memory/
│   │   │   ├── memory.module.ts
│   │   │   ├── memory.service.ts
│   │   │   ├── services/
│   │   │   │   ├── rag.service.ts
│   │   │   │   ├── embedding.service.ts
│   │   │   │   └── summarization.service.ts
│   │   │   └── providers/
│   │   │       ├── pinecone.provider.ts
│   │   │       └── pgvector.provider.ts
│   │   ├── media/
│   │   │   ├── media.module.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   └── services/
│   │   │       ├── image-generation.service.ts
│   │   │       ├── lora-manager.service.ts
│   │   │       ├── tts.service.ts
│   │   │       └── video-state.service.ts
│   │   ├── moderation/
│   │   │   ├── moderation.module.ts
│   │   │   ├── moderation.service.ts
│   │   │   └── providers/
│   │   │       └── llama-guard.provider.ts
│   │   ├── payments/
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.service.ts
│   │   │   └── services/
│   │   │       ├── credits.service.ts
│   │   │       ├── subscriptions.service.ts
│   │   │       └── revenuecat.service.ts
│   │   ├── discover/
│   │   │   ├── discover.module.ts
│   │   │   ├── discover.controller.ts
│   │   │   └── discover.service.ts
│   │   └── webhooks/
│   │       ├── webhooks.module.ts
│   │       └── controllers/
│   │           └── revenuecat-webhook.controller.ts
│   └── integrations/           # External API clients
│       ├── groq/
│       │   └── groq.service.ts
│       ├── openai/
│       │   └── openai.service.ts
│       ├── fal/
│       │   └── fal.service.ts
│       ├── elevenlabs/
│       │   └── elevenlabs.service.ts
│       ├── azure-tts/
│       │   └── azure-tts.service.ts
│       └── livekit/
│           └── livekit.service.ts
├── test/
│   ├── unit/
│   └── e2e/
├── prisma/                     # Symlink to packages/database
├── package.json
├── tsconfig.json
├── nest-cli.json
└── Dockerfile
```

### 2. AI Service ([`apps/ai-service/`](apps/ai-service))

FastAPI Python service for heavy ML operations.

```
apps/ai-service/
├── src/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Configuration
│   ├── api/
│   │   ├── routes/
│   │   │   ├── embeddings.py
│   │   │   ├── rag.py
│   │   │   └── health.py
│   │   └── dependencies.py
│   ├── services/
│   │   ├── embedding_service.py
│   │   ├── rag_service.py
│   │   └── summarization_service.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── model_loader.py
│   ├── utils/
│   │   ├── text_processing.py
│   │   └── vector_utils.py
│   └── schemas/
│       ├── embedding.py
│       └── rag.py
├── tests/
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── README.md
```

---

## Frontend Applications

### 3. Web App ([`apps/web/`](apps/web))

Next.js 14+ application with App Router.

```
apps/web/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── discover/
│   │   │   ├── characters/
│   │   │   └── settings/
│   │   ├── chat/
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx
│   │   └── api/                # API routes if needed
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── character/
│   │   │   ├── CharacterCard.tsx
│   │   │   ├── CharacterCreator.tsx
│   │   │   └── PersonalitySliders.tsx
│   │   ├── media/
│   │   │   ├── ImageViewer.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── AudioPlayer.tsx
│   │   ├── video-call/
│   │   │   ├── VideoCallPlayer.tsx
│   │   │   └── VideoStateOverlay.tsx
│   │   ├── discover/
│   │   │   ├── FeedScroll.tsx
│   │   │   └── TrendingSection.tsx
│   │   └── ui/                 # From packages/ui
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── websocket.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useWebSocket.ts
│   │   ├── useVideoCall.ts
│   │   └── useAuth.ts
│   ├── store/                  # Zustand or Redux
│   │   ├── auth.store.ts
│   │   ├── chat.store.ts
│   │   └── character.store.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── images/
│   └── videos/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── Dockerfile
```

### 4. Mobile App ([`apps/mobile/`](apps/mobile))

React Native with Expo.

```
apps/mobile/
├── src/
│   ├── App.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── discover/
│   │   │   └── DiscoverFeedScreen.tsx
│   │   ├── characters/
│   │   │   ├── CharacterListScreen.tsx
│   │   │   ├── CharacterDetailScreen.tsx
│   │   │   └── CharacterCreatorScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx
│   │   ├── video-call/
│   │   │   └── VideoCallScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       └── SubscriptionScreen.tsx
│   ├── components/
│   │   ├── chat/
│   │   ├── character/
│   │   ├── media/
│   │   └── ui/
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── websocket.service.ts
│   │   ├── revenuecat.service.ts
│   │   └── storage.service.ts
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useAuth.ts
│   │   └── useSubscription.ts
│   ├── store/
│   │   └── index.ts
│   └── utils/
│       └── helpers.ts
├── assets/
│   ├── images/
│   └── fonts/
├── app.json
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## Shared Packages

### 5. Database ([`packages/database/`](packages/database))

Prisma schema and client shared across all services.

```
packages/database/
├── prisma/
│   ├── schema.prisma           # Main schema
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── index.ts                # Export Prisma client
│   └── types.ts                # Generated types
├── package.json
└── tsconfig.json
```

**schema.prisma** structure:
```prisma
// User Management
model User { }
model Session { }

// Character System
model Character { }
model CharacterMedia { }
model LoRAModel { }

// Conversations
model Conversation { }
model Message { }
model MemorySummary { }

// Monetization
model Transaction { }
model Subscription { }
model CreditPackage { }

// Analytics
model UserActivity { }
model CharacterStats { }
```

### 6. Shared Types ([`packages/types/`](packages/types))

TypeScript types shared between frontend and backend.

```
packages/types/
├── src/
│   ├── index.ts
│   ├── api/
│   │   ├── auth.types.ts
│   │   ├── character.types.ts
│   │   ├── chat.types.ts
│   │   └── payment.types.ts
│   ├── models/
│   │   ├── user.types.ts
│   │   ├── character.types.ts
│   │   └── conversation.types.ts
│   ├── enums/
│   │   └── index.ts
│   └── websocket/
│       └── events.types.ts
├── package.json
└── tsconfig.json
```

### 7. UI Components ([`packages/ui/`](packages/ui))

Shared React components for web and mobile.

```
packages/ui/
├── src/
│   ├── index.ts
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.styles.ts
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Avatar/
│   │   └── Modal/
│   └── hooks/
│       └── useMediaQuery.ts
├── package.json
└── tsconfig.json
```

### 8. Utilities ([`packages/utils/`](packages/utils))

Shared utility functions.

```
packages/utils/
├── src/
│   ├── index.ts
│   ├── formatting/
│   │   ├── date.utils.ts
│   │   └── text.utils.ts
│   ├── validation/
│   │   └── validators.ts
│   └── constants/
│       └── index.ts
├── package.json
└── tsconfig.json
```

---

## Infrastructure

### Docker Compose ([`docker-compose.yml`](docker-compose.yml))

Local development environment:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ethereal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
      - ai-service
    environment:
      - DATABASE_URL=postgresql://postgres:dev_password@postgres:5432/ethereal
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./apps/api:/app
      - /app/node_modules

  ai-service:
    build:
      context: .
      dockerfile: apps/ai-service/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./apps/ai-service:/app

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./apps/web:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

## Configuration Files

### Root [`package.json`](package.json)

```json
{
  "name": "ethereal-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*",
    "services/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "db:generate": "cd packages/database && prisma generate",
    "db:migrate": "cd packages/database && prisma migrate dev",
    "db:seed": "cd packages/database && prisma db seed",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "latest",
    "eslint": "latest"
  }
}
```

### [`turbo.json`](turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
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
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd ethereal

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start infrastructure
npm run docker:up

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start all services
npm run dev
```

### Running Individual Services

```bash
# API only
cd apps/api && npm run dev

# Web only
cd apps/web && npm run dev

# Mobile only
cd apps/mobile && npm start

# AI service only
cd apps/ai-service && uvicorn src.main:app --reload
```

---

## Build & Deployment

### Production Build

```bash
# Build all apps
npm run build

# Build specific app
turbo run build --filter=api
turbo run build --filter=web
```

### Docker Images

```bash
# Build images
docker build -t ethereal-api -f apps/api/Dockerfile .
docker build -t ethereal-web -f apps/web/Dockerfile .
docker build -t ethereal-ai -f apps/ai-service/Dockerfile .

# Push to registry
docker push your-registry/ethereal-api:latest
```

---

## Key Design Decisions

1. **Monorepo**: Single repository for easier code sharing and atomic commits
2. **Turborepo**: Fast incremental builds and task caching
3. **Shared Packages**: Reduce duplication between frontend/backend
4. **Docker Compose**: Consistent local development environment
5. **Prisma**: Type-safe database access with migrations
6. **NestJS**: Modular, scalable backend architecture
7. **Expo**: Faster mobile development with OTA updates

---

## Next Steps

1. Initialize monorepo structure
2. Set up Prisma schema
3. Create Docker Compose environment
4. Implement core modules
5. Build frontend applications

See **[`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)** for step-by-step instructions.
