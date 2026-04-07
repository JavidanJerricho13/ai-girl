# ROADMAP.md - Ethereal AI Companion Platform
## Vertical Slicing Implementation Strategy

> **Philosophy**: Build end-to-end functional slices, not horizontal layers. Each slice delivers a working feature that can be tested and validated immediately.

---

## 📋 Project Overview

**Technology Stack**:
- **Monorepo**: Turborepo with workspaces
- **Backend**: NestJS (TypeScript) + FastAPI (Python)
- **Frontend**: Next.js 14 (Web) + React Native/Expo (Mobile)
- **Database**: PostgreSQL 15 + pgvector + Redis
- **AI Services**: Groq (Llama 3), OpenAI (GPT-4o-mini), fal.ai (Flux.1), ElevenLabs, Azure TTS

**Project Structure**:
```
ethereal/
├── apps/
│   ├── api/              # NestJS API Gateway (Port 3001)
│   ├── ai-service/       # FastAPI ML Service (Port 8000)
│   ├── web/              # Next.js Web App (Port 3000)
│   └── mobile/           # React Native (Expo)
├── packages/
│   ├── database/         # Prisma schema & client
│   ├── types/            # Shared TypeScript types
│   ├── ui/               # Shared React components
│   └── utils/            # Shared utilities
└── docker-compose.yml    # PostgreSQL + Redis
```

---

## 🎯 Slice 1: Скелет и Пинг (Skeleton & Ping) - Days 1-3

**Objective**: Set up monorepo infrastructure and establish frontend-backend communication.

**Success Criteria**: 
✅ Web frontend can ping backend and receive a health check response
✅ Docker infrastructure running
✅ Build system working with Turborepo

### 1.1 Initialize Monorepo Structure

- [ ] **Create root directory and initialize npm workspace**
  - File: [`package.json`](package.json)
  - Content: Workspaces for `apps/*` and `packages/*`
  - Scripts: `dev`, `build`, `test`, `db:generate`, `db:migrate`

- [ ] **Install and configure Turborepo**
  - File: [`turbo.json`](turbo.json)
  - Pipeline tasks: `build`, `dev`, `test`, `lint`, `db:generate`
  - Cache configuration for build outputs

- [ ] **Create folder structure**
  ```bash
  mkdir -p apps/{api,ai-service,web,mobile}
  mkdir -p packages/{database,types,ui,utils}
  mkdir -p infrastructure/docker scripts docs plans
  ```

### 1.2 Set Up Docker Infrastructure

- [ ] **Create Docker Compose configuration**
  - File: [`docker-compose.yml`](docker-compose.yml)
  - Services:
    - `postgres`: pgvector/pgvector:pg15 (Port 5432)
    - `redis`: redis:7-alpine (Port 6379)
  - Volumes: `postgres_data`, `redis_data`
  - Health checks for both services

- [ ] **Start Docker services**
  ```bash
  docker-compose up -d
  docker-compose ps  # Verify running
  ```

### 1.3 Initialize NestJS API Gateway

- [ ] **Create NestJS application structure**
  - Location: [`apps/api/`](apps/api)
  - Entry point: [`apps/api/src/main.ts`](apps/api/src/main.ts)
  - Root module: [`apps/api/src/app.module.ts`](apps/api/src/app.module.ts)

- [ ] **Install core dependencies**
  ```bash
  cd apps/api
  npm install @nestjs/common @nestjs/core @nestjs/platform-express
  npm install @nestjs/config @nestjs/swagger
  npm install -D @nestjs/cli typescript @types/node
  ```

- [ ] **Configure CORS and global settings**
  - File: [`apps/api/src/main.ts`](apps/api/src/main.ts:1)
  - Enable CORS for `http://localhost:3000`
  - Global validation pipe
  - Swagger documentation at `/api/docs`

- [ ] **Create health check endpoint**
  - File: [`apps/api/src/common/controllers/health.controller.ts`](apps/api/src/common/controllers/health.controller.ts)
  - Route: `GET /health`
  - Response: `{ status: 'ok', timestamp: Date.now() }`

- [ ] **Set up environment configuration**
  - File: [`apps/api/.env`](apps/api/.env)
  - Variables:
    ```
    PORT=3001
    NODE_ENV=development
    CORS_ORIGIN=http://localhost:3000
    DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/ethereal
    REDIS_URL=redis://localhost:6379
    ```

- [ ] **Start NestJS server**
  ```bash
  cd apps/api
  npm run start:dev  # Should run on port 3001
  ```

### 1.4 Initialize Next.js Web Application

- [ ] **Create Next.js application with App Router**
  - Location: [`apps/web/`](apps/web)
  - Initialize with TypeScript, TailwindCSS, App Router
  ```bash
  cd apps/web
  npx create-next-app@latest . --typescript --tailwind --app
  ```

- [ ] **Install additional dependencies**
  ```bash
  npm install axios
  npm install lucide-react  # Icons
  ```

- [ ] **Configure environment variables**
  - File: [`apps/web/.env.local`](apps/web/.env.local)
  - Variable: `NEXT_PUBLIC_API_URL=http://localhost:3001`

- [ ] **Create API client utility**
  - File: [`apps/web/src/lib/api-client.ts`](apps/web/src/lib/api-client.ts)
  - Axios instance with base URL from environment
  - Request interceptor for auth tokens (placeholder)

- [ ] **Create homepage with Ping button**
  - File: [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)
  - UI: Simple button "Ping Backend"
  - Action: Call `GET /health` endpoint
  - Display: Show response status and timestamp

- [ ] **Add basic styling**
  - File: [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css)
  - TailwindCSS configuration
  - Basic layout and typography

- [ ] **Start Next.js dev server**
  ```bash
  cd apps/web
  npm run dev  # Should run on port 3000
  ```

### 1.5 Test End-to-End Communication

- [ ] **Verify Docker services are running**
  ```bash
  docker-compose ps
  # Expected: postgres (healthy), redis (healthy)
  ```

- [ ] **Test API health endpoint directly**
  ```bash
  curl http://localhost:3001/health
  # Expected: {"status":"ok","timestamp":...}
  ```

- [ ] **Test from web frontend**
  - Navigate to `http://localhost:3000`
  - Click "Ping Backend" button
  - Verify success response displayed

- [ ] **Check CORS is working**
  - Open browser DevTools Network tab
  - Verify no CORS errors in console
  - Verify response headers include `Access-Control-Allow-Origin`

### 1.6 Configure Turborepo Build Pipeline

- [ ] **Test Turborepo commands**
  ```bash
  # From root directory
  npm run dev     # Should start all services
  npm run build   # Should build all apps
  npm run lint    # Should lint all code
  ```

- [ ] **Verify incremental builds work**
  - Make a change in `apps/api`
  - Run `npm run build`
  - Verify only API rebuilds (cached Next.js build)

### ✅ Slice 1 Deliverables

- [x] Monorepo with Turborepo configured
- [x] Docker Compose with PostgreSQL + Redis running
- [x] NestJS API on port 3001 with `/health` endpoint
- [x] Next.js Web on port 3000 with Ping functionality
- [x] CORS configured properly
- [x] End-to-end communication verified

---

## 💬 Slice 2: Core Loop (Chat MVP) - Days 4-7

**Objective**: Build real-time chat functionality with AI text generation (no database persistence yet).

**Success Criteria**:
✅ User can type a message and receive AI response in real-time
✅ Streaming text generation works
✅ Language detection routes to correct model (English → Groq, Azerbaijani → OpenAI)

### 2.1 Integrate Groq API (Primary Text Generation)

- [ ] **Sign up for Groq API**
  - URL: [console.groq.com](https://console.groq.com)
  - Get API key from dashboard
  - Model: `llama3-70b-8192`

- [ ] **Add environment variables**
  - File: [`apps/api/.env`](apps/api/.env)
  ```
  GROQ_API_KEY=gsk_xxxxxxxxxxxxx
  GROQ_MODEL=llama3-70b-8192
  GROQ_MAX_TOKENS=2048
  GROQ_TEMPERATURE=0.7
  ```

- [ ] **Install Groq SDK**
  ```bash
  cd apps/api
  npm install groq-sdk
  ```

- [ ] **Create Groq integration service**
  - File: [`apps/api/src/integrations/groq/groq.service.ts`](apps/api/src/integrations/groq/groq.service.ts)
  - Method: `async *streamResponse(systemPrompt, userMessage)` - Generator function
  - Features:
    - Stream chat completions
    - Handle errors gracefully
    - Track token usage

- [ ] **Create Groq module**
  - File: [`apps/api/src/integrations/groq/groq.module.ts`](apps/api/src/integrations/groq/groq.module.ts)
  - Export `GroqService` for use in other modules

### 2.2 Integrate OpenAI API (Azerbaijani Support)

- [ ] **Sign up for OpenAI API**
  - URL: [platform.openai.com](https://platform.openai.com)
  - Add payment method
  - Generate API key

- [ ] **Add environment variables**
  - File: [`apps/api/.env`](apps/api/.env)
  ```
  OPENAI_API_KEY=sk-xxxxxxxxxxxxx
  OPENAI_MODEL_AZ=gpt-4o-mini
  OPENAI_MAX_TOKENS=1500
  OPENAI_TEMPERATURE=0.8
  ```

- [ ] **Install OpenAI SDK**
  ```bash
  cd apps/api
  npm install openai
  ```

- [ ] **Create OpenAI integration service**
  - File: [`apps/api/src/integrations/openai/openai.service.ts`](apps/api/src/integrations/openai/openai.service.ts)
  - Method: `async *streamResponse(systemPrompt, userMessage)` - Generator function
  - Features:
    - Stream chat completions
    - Support Azerbaijani language
    - Handle errors

- [ ] **Create OpenAI module**
  - File: [`apps/api/src/integrations/openai/openai.module.ts`](apps/api/src/integrations/openai/openai.module.ts)
  - Export `OpenAIService`

### 2.3 Implement Chat Module

- [ ] **Create Chat module structure**
  - Directory: [`apps/api/src/modules/chat/`](apps/api/src/modules/chat)
  - Files:
    - `chat.module.ts`
    - `chat.controller.ts`
    - `chat.service.ts`

- [ ] **Create Model Router Service**
  - File: [`apps/api/src/modules/chat/services/model-router.service.ts`](apps/api/src/modules/chat/services/model-router.service.ts)
  - Method: `detectLanguage(text: string): 'en' | 'az'`
    - Check for Azerbaijani characters: əöüğışçӘÖÜĞIŞÇ
    - Return 'az' if found, otherwise 'en'
  - Method: `async *generateResponse({ prompt, systemPrompt })`
    - Detect language
    - Route to Groq (English) or OpenAI (Azerbaijani)
    - Stream response chunks

- [ ] **Create Streaming Service**
  - File: [`apps/api/src/modules/chat/services/streaming.service.ts`](apps/api/src/modules/chat/services/streaming.service.ts)
  - Handle Server-Sent Events (SSE) for streaming
  - Convert async generator to SSE format

- [ ] **Create Chat Controller**
  - File: [`apps/api/src/modules/chat/chat.controller.ts`](apps/api/src/modules/chat/chat.controller.ts)
  - Endpoint: `POST /chat/message` (without persistence)
  - Request DTO:
    ```typescript
    {
      message: string;
      characterPrompt?: string;
    }
    ```
  - Response: Server-Sent Events stream

- [ ] **Implement SSE endpoint**
  - Use `@Sse()` decorator from NestJS
  - Stream AI response chunks in real-time
  - Send `[DONE]` message when complete

### 2.4 Set Up WebSocket Gateway (Alternative to SSE)

- [ ] **Install Socket.io dependencies**
  ```bash
  cd apps/api
  npm install @nestjs/websockets @nestjs/platform-socket.io
  npm install socket.io
  ```

- [ ] **Create WebSocket Gateway**
  - File: [`apps/api/src/modules/conversations/conversations.gateway.ts`](apps/api/src/modules/conversations/conversations.gateway.ts)
  - Event: `send-message` - Accept message from client
  - Event: `message-chunk` - Send response chunks to client
  - Event: `message-complete` - Signal completion
  - CORS: Allow `http://localhost:3000`

- [ ] **Integrate Chat Service with WebSocket**
  - Emit chunks as they're generated
  - Handle connection/disconnection
  - Room-based messaging (per conversation)

### 2.5 Build Chat UI in Next.js

- [ ] **Install frontend dependencies**
  ```bash
  cd apps/web
  npm install socket.io-client
  npm install @tanstack/react-query
  npm install framer-motion  # Animations
  ```

- [ ] **Create WebSocket hook**
  - File: [`apps/web/src/hooks/useWebSocket.ts`](apps/web/src/hooks/useWebSocket.ts)
  - Connect to `ws://localhost:3001`
  - Handle connection state
  - Emit and listen for events

- [ ] **Create Chat components**
  - File: [`apps/web/src/components/chat/ChatWindow.tsx`](apps/web/src/components/chat/ChatWindow.tsx)
    - Display messages list
    - Auto-scroll to bottom
    - Typing indicator
  
  - File: [`apps/web/src/components/chat/MessageList.tsx`](apps/web/src/components/chat/MessageList.tsx)
    - Render user and assistant messages
    - Different styling for each role
    - Timestamps
  
  - File: [`apps/web/src/components/chat/MessageInput.tsx`](apps/web/src/components/chat/MessageInput.tsx)
    - Text input with send button
    - Handle Enter key
    - Disable while sending
  
  - File: [`apps/web/src/components/chat/TypingIndicator.tsx`](apps/web/src/components/chat/TypingIndicator.tsx)
    - Animated dots during streaming

- [ ] **Create Chat page**
  - File: [`apps/web/src/app/chat/page.tsx`](apps/web/src/app/chat/page.tsx)
  - Layout: Full-screen chat interface
  - State: Messages array (in-memory)
  - Features:
    - Connect WebSocket on mount
    - Send message via WebSocket
    - Append streaming chunks to current message
    - Handle completion

### 2.6 Test Chat Functionality

- [ ] **Test English conversation**
  - Send: "Hello, how are you?"
  - Verify: Response from Groq (Llama 3)
  - Check: Streaming works smoothly

- [ ] **Test Azerbaijani conversation**
  - Send: "Salam, necəsən?"
  - Verify: Response from OpenAI (GPT-4o-mini)
  - Check: Proper Azerbaijani grammar

- [ ] **Test language detection**
  - Send mixed messages
  - Verify correct model routing

- [ ] **Test streaming performance**
  - Measure time to first token (target: <200ms)
  - Check for smooth character-by-character rendering

- [ ] **Test error handling**
  - Disconnect internet
  - Verify graceful error messages
  - Test reconnection logic

### ✅ Slice 2 Deliverables

- [x] Groq API integrated for English chat
- [x] OpenAI API integrated for Azerbaijani chat
- [x] Language detection and model routing working
- [x] WebSocket/SSE streaming functional
- [x] Chat UI with real-time message display
- [x] Sub-200ms first token latency achieved
- [x] No database - pure in-memory chat

---

## 🧠 Slice 3: Интеграция Памяти и БД (Memory & Database Integration) - Days 8-12

**Objective**: Add persistent storage and RAG-based memory system.

**Success Criteria**:
✅ Users can register and login
✅ Chat conversations are saved to database
✅ AI remembers context from previous conversations (RAG)

### 3.1 Set Up Database Package

- [ ] **Initialize Prisma in shared package**
  ```bash
  cd packages/database
  npm init -y
  npm install prisma @prisma/client
  npm install -D typescript ts-node @types/node
  npx prisma init
  ```

- [ ] **Create Prisma schema**
  - File: [`packages/database/prisma/schema.prisma`](packages/database/prisma/schema.prisma)
  - Models to implement in this slice:
    
    **User Management:**
    - `User` - id, email, username, passwordHash, firstName, lastName, avatar, language, timezone, credits, isPremium
    - `Session` - id, userId, accessToken, refreshToken, expiresAt, deviceInfo
    
    **Character System:**
    - `Character` - id, name, displayName, description, systemPrompt, shynessBold, romanticPragmatic, playfulSerious, voiceId, loraModelId, isPublic, isPremium, category, tags, createdBy
    
    **Conversations:**
    - `Conversation` - id, userId, characterId, title, language, messageCount, lastMessageAt, isActive
    - `Message` - id, conversationId, userId, role, content, language, modelUsed, tokensUsed, latencyMs, createdAt
    - `MemorySummary` - id, conversationId, summary, messageRange, createdAt

- [ ] **Configure PostgreSQL connection**
  - File: [`packages/database/.env`](packages/database/.env)
  ```
  DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/ethereal
  ```

- [ ] **Run initial migration**
  ```bash
  cd packages/database
  npx prisma migrate dev --name init
  npx prisma generate
  ```

- [ ] **Create seed data**
  - File: [`packages/database/prisma/seed.ts`](packages/database/prisma/seed.ts)
  - Create test user: test@ethereal.app / password123
  - Create 2 official characters:
    - Leyla - Azerbaijani romantic companion
    - Ayla - Energetic tech-savvy friend
  - Seed credit packages

- [ ] **Run seed script**
  ```bash
  npx prisma db seed
  ```

### 3.2 Implement Authentication Module

- [ ] **Install auth dependencies**
  ```bash
  cd apps/api
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt
  npm install bcrypt
  npm install -D @types/bcrypt @types/passport-jwt
  ```

- [ ] **Create Prisma Service**
  - File: [`apps/api/src/common/services/prisma.service.ts`](apps/api/src/common/services/prisma.service.ts)
  - Extend PrismaClient
  - Handle connection lifecycle

- [ ] **Create Auth module structure**
  - Directory: [`apps/api/src/modules/auth/`](apps/api/src/modules/auth)
  - Files:
    - `auth.module.ts`
    - `auth.controller.ts`
    - `auth.service.ts`
    - `strategies/jwt.strategy.ts`
    - `guards/auth.guard.ts`
    - `dto/login.dto.ts`
    - `dto/register.dto.ts`

- [ ] **Implement Auth Service**
  - File: [`apps/api/src/modules/auth/auth.service.ts`](apps/api/src/modules/auth/auth.service.ts)
  - Methods:
    - `async register({ email, password, username })` - Hash password, create user
    - `async login({ email, password })` - Verify credentials, generate JWT
    - `async validateUser(userId)` - Get user by ID for JWT strategy
    - `async refreshToken(refreshToken)` - Generate new access token

- [ ] **Configure JWT strategy**
  - File: [`apps/api/src/modules/auth/strategies/jwt.strategy.ts`](apps/api/src/modules/auth/strategies/jwt.strategy.ts)
  - Extract user from JWT token
  - Validate user exists

- [ ] **Create Auth endpoints**
  - File: [`apps/api/src/modules/auth/auth.controller.ts`](apps/api/src/modules/auth/auth.controller.ts)
  - `POST /auth/register` - Register new user
  - `POST /auth/login` - Login and get tokens
  - `POST /auth/refresh` - Refresh access token
  - `GET /auth/me` - Get current user (protected)

- [ ] **Add JWT secret to environment**
  - File: [`apps/api/.env`](apps/api/.env)
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-in-production
  JWT_EXPIRATION=15m
  JWT_REFRESH_EXPIRATION=7d
  ```

### 3.3 Implement User Module

- [ ] **Create Users module structure**
  - Directory: [`apps/api/src/modules/users/`](apps/api/src/modules/users)
  - Files:
    - `users.module.ts`
    - `users.controller.ts`
    - `users.service.ts`

- [ ] **Implement Users Service**
  - File: [`apps/api/src/modules/users/users.service.ts`](apps/api/src/modules/users/users.service.ts)
  - Methods:
    - `findById(id)` - Get user by ID
    - `findByEmail(email)` - Get user by email
    - `update(id, data)` - Update user profile
    - `getUserCredits(id)` - Get credit balance

- [ ] **Create Users endpoints**
  - `GET /users/profile` - Get current user profile
  - `PATCH /users/profile` - Update profile
  - `GET /users/credits` - Get credit balance

### 3.4 Implement Characters Module

- [ ] **Create Characters module structure**
  - Directory: [`apps/api/src/modules/characters/`](apps/api/src/modules/characters)
  - Files:
    - `characters.module.ts`
    - `characters.controller.ts`
    - `characters.service.ts`
    - `dto/create-character.dto.ts`
    - `dto/update-character.dto.ts`

- [ ] **Implement Characters Service**
  - File: [`apps/api/src/modules/characters/characters.service.ts`](apps/api/src/modules/characters/characters.service.ts)
  - Methods:
    - `findAll(userId)` - Get public + user's characters
    - `findOne(id)` - Get character by ID
    - `create(userId, data)` - Create new character
    - `update(id, userId, data)` - Update character
    - `delete(id, userId)` - Delete character

- [ ] **Create Characters endpoints**
  - `GET /characters` - List characters
  - `POST /characters` - Create character (protected)
  - `GET /characters/:id` - Get character details
  - `PATCH /characters/:id` - Update character (protected)
  - `DELETE /characters/:id` - Delete character (protected)

### 3.5 Implement Conversations Module

- [ ] **Create Conversations module structure**
  - Directory: [`apps/api/src/modules/conversations/`](apps/api/src/modules/conversations)
  - Files:
    - `conversations.module.ts`
    - `conversations.controller.ts`
    - `conversations.service.ts`

- [ ] **Implement Conversations Service**
  - File: [`apps/api/src/modules/conversations/conversations.service.ts`](apps/api/src/modules/conversations/conversations.service.ts)
  - Methods:
    - `create(userId, characterId)` - Create new conversation
    - `findAll(userId)` - Get user's conversations
    - `findOne(id)` - Get conversation with messages
    - `delete(id)` - Delete conversation

- [ ] **Create Conversations endpoints**
  - `GET /conversations` - List conversations
  - `POST /conversations` - Create conversation
  - `GET /conversations/:id` - Get conversation details
  - `DELETE /conversations/:id` - Delete conversation

### 3.6 Update Chat Module for Persistence

- [ ] **Modify Chat Service to save messages**
  - File: [`apps/api/src/modules/chat/chat.service.ts`](apps/api/src/modules/chat/chat.service.ts)
  - Store user message in database (Message model)
  - Store assistant response in database
  - Track metadata: modelUsed, tokensUsed, latencyMs

- [ ] **Update Chat Controller**
  - Require authentication (use JwtAuthGuard)
  - Accept conversationId in request
  - Load conversation context from database

- [ ] **Update WebSocket Gateway**
  - Add authentication to WebSocket connections
  - Join rooms based on conversationId
  - Save messages as they're generated

### 3.7 Set Up Vector Database (Pinecone or pgvector)

**Option A: Pinecone (Recommended for MVP)**

- [ ] **Sign up for Pinecone**
  - URL: [pinecone.io](https://pinecone.io)
  - Create free account (1M vectors)

- [ ] **Create index**
  - Name: `ethereal-memory`
  - Dimensions: 1536 (OpenAI) or 384 (sentence-transformers)
  - Metric: Cosine similarity

- [ ] **Add environment variables**
  ```
  PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  PINECONE_ENVIRONMENT=us-west1-gcp
  PINECONE_INDEX=ethereal-memory
  ```

- [ ] **Install Pinecone client**
  ```bash
  cd apps/api
  npm install @pinecone-database/pinecone
  ```

- [ ] **Create Pinecone provider**
  - File: [`apps/api/src/modules/memory/providers/pinecone.provider.ts`](apps/api/src/modules/memory/providers/pinecone.provider.ts)
  - Methods:
    - `async upsert({ id, values, metadata })`
    - `async query({ vector, topK, filter })`
    - `async delete({ ids })`

**Option B: pgvector (Cost-effective alternative)**

- [ ] **Enable pgvector extension**
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```

- [ ] **Add vector column to MemorySummary**
  ```prisma
  model MemorySummary {
    // ... other fields
    embedding Unsupported("vector(1536)")?
  }
  ```

- [ ] **Create vector index**
  ```sql
  CREATE INDEX idx_memory_embedding ON "MemorySummary" 
  USING ivfflat (embedding vector_cosine_ops);
  ```

### 3.8 Implement Memory/RAG Module

- [ ] **Create Memory module structure**
  - Directory: [`apps/api/src/modules/memory/`](apps/api/src/modules/memory)
  - Files:
    - `memory.module.ts`
    - `memory.service.ts`
    - `services/rag.service.ts`
    - `services/embedding.service.ts`
    - `services/summarization.service.ts`

- [ ] **Implement Embedding Service**
  - File: [`apps/api/src/modules/memory/services/embedding.service.ts`](apps/api/src/modules/memory/services/embedding.service.ts)
  - Use OpenAI `text-embedding-3-small` API
  - Method: `async embed(text: string): Promise<number[]>`

- [ ] **Implement Summarization Service**
  - File: [`apps/api/src/modules/memory/services/summarization.service.ts`](apps/api/src/modules/memory/services/summarization.service.ts)
  - Use GPT-4o-mini to create concise summaries
  - Method: `async summarize(messages: Message[]): Promise<string>`

- [ ] **Implement RAG Service**
  - File: [`apps/api/src/modules/memory/services/rag.service.ts`](apps/api/src/modules/memory/services/rag.service.ts)
  - Methods:
    - `async getContext(conversationId)` - Get short-term + long-term memory
    - `async storeMemory(conversationId, messages)` - Summarize and store
  - Logic:
    - Retrieve last 10 messages (short-term)
    - Query vector DB for top-3 relevant memories (long-term)
    - Combine into context string

- [ ] **Integrate RAG into Chat flow**
  - Before generating response, call `ragService.getContext()`
  - Include context in system prompt
  - After every 5 message pairs, call `ragService.storeMemory()`

### 3.9 Initialize FastAPI AI Service (for embeddings)

- [ ] **Create FastAPI project structure**
  - Directory: [`apps/ai-service/src/`](apps/ai-service/src)
  ```bash
  cd apps/ai-service
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```

- [ ] **Install dependencies**
  ```bash
  pip install fastapi uvicorn
  pip install sentence-transformers
  pip install pinecone-client
  ```
  - File: [`apps/ai-service/requirements.txt`](apps/ai-service/requirements.txt)

- [ ] **Create FastAPI application**
  - File: [`apps/ai-service/src/main.py`](apps/ai-service/src/main.py)
  - CORS enabled for `http://localhost:3001`
  - Routes: `/embeddings`, `/rag`, `/health`

- [ ] **Implement Embedding Service**
  - File: [`apps/ai-service/src/services/embedding_service.py`](apps/ai-service/src/services/embedding_service.py)
  - Load model: `sentence-transformers/all-MiniLM-L6-v2`
  - Method: `embed(text: str) -> List[float]`
  - Method: `embed_batch(texts: List[str]) -> List[List[float]]`

- [ ] **Create embedding endpoint**
  - File: [`apps/ai-service/src/api/routes/embeddings.py`](apps/ai-service/src/api/routes/embeddings.py)
  - `POST /embeddings/single` - Embed single text
  - `POST /embeddings/batch` - Embed multiple texts

- [ ] **Start FastAPI server**
  ```bash
  cd apps/ai-service
  uvicorn src.main:app --reload --port 8000
  ```

- [ ] **Add to Docker Compose**
  - Update [`docker-compose.yml`](docker-compose.yml)
  - Add `ai-service` container
  - Port: 8000

### 3.10 Update Frontend for Authentication

- [ ] **Create auth context/store**
  - File: [`apps/web/src/store/auth.store.ts`](apps/web/src/store/auth.store.ts)
  - Using Zustand
  - State: user, accessToken, refreshToken, isAuthenticated
  - Actions: login, register, logout, refreshToken

- [ ] **Create auth pages**
  - File: [`apps/web/src/app/(auth)/login/page.tsx`](apps/web/src/app/(auth)/login/page.tsx)
    - Email/password form
    - Call `POST /auth/login`
    - Store tokens in localStorage
  
  - File: [`apps/web/src/app/(auth)/register/page.tsx`](apps/web/src/app/(auth)/register/page.tsx)
    - Registration form
    - Call `POST /auth/register`

- [ ] **Create protected route wrapper**
  - File: [`apps/web/src/components/auth/ProtectedRoute.tsx`](apps/web/src/components/auth/ProtectedRoute.tsx)
  - Check authentication status
  - Redirect to login if not authenticated

- [ ] **Update chat page to be protected**
  - Wrap chat page with ProtectedRoute
  - Pass accessToken to WebSocket connection
  - Display user's conversations list

- [ ] **Create conversation selector**
  - File: [`apps/web/src/components/chat/ConversationList.tsx`](apps/web/src/components/chat/ConversationList.tsx)
  - List user's conversations
  - Create new conversation button
  - Select character for new conversation

### 3.11 Test Complete Flow

- [ ] **Test user registration**
  - Register new user via web UI
  - Verify user created in database

- [ ] **Test login**
  - Login with credentials
  - Verify JWT tokens received and stored

- [ ] **Test conversation creation**
  - Create new conversation with a character
  - Verify conversation saved to database

- [ ] **Test message persistence**
  - Send multiple messages
  - Refresh page
  - Verify messages loaded from database

- [ ] **Test memory/RAG system**
  - Have conversation with 10+ message pairs
  - Verify summaries created every 5 pairs
  - Ask about earlier topics
  - Verify AI recalls context

- [ ] **Test character selection**
  - Create conversation with different characters
  - Verify correct personality/prompt used

### ✅ Slice 3 Deliverables

- [x] PostgreSQL database with full Prisma schema
- [x] User authentication with JWT
- [x] Character management system
- [x] Persistent conversations and messages
- [x] RAG memory system with vector database
- [x] FastAPI service for embeddings
- [x] Frontend auth flow (login/register)
- [x] Complete working AI companion with memory

---

## 🎨 Slice 4: Мультимодальность (Multimodal - Images & Voice) - Days 13-17

**Objective**: Add image generation, voice synthesis, and pseudo-video call features.

**Success Criteria**:
✅ Generate character images on demand
✅ Synthesize voice for AI messages (English + Azerbaijani)
✅ Pseudo-video call UI with state machine

### 4.1 Integrate fal.ai Image Generation

- [ ] **Sign up for fal.ai**
  - URL: [fal.ai](https://fal.ai)
  - Get API key

- [ ] **Add environment variables**
  ```
  FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  FAL_MODEL=fal-ai/flux-lora
  FAL_DEFAULT_STEPS=28
  FAL_GUIDANCE_SCALE=3.5
  ```

- [ ] **Install fal.ai SDK**
  ```bash
  cd apps/api
  npm install @fal-ai/serverless-client
  ```

- [ ] **Create fal.ai integration service**
  - File: [`apps/api/src/integrations/fal/fal.service.ts`](apps/api/src/integrations/fal/fal.service.ts)
  - Method: `async generateImage({ prompt, loraUrl, loraWeight, imageSize, enableSafety })`
  - Support Flux.1 Dev + LoRA models

- [ ] **Add LoRA models to database**
  - Model: `LoRAModel` from [`DATABASE_SCHEMA.md`](plans/DATABASE_SCHEMA.md:308)
  - Fields: characterId, modelUrl, triggerWords, weight, trainingImages
  - Seed with placeholder LoRA for test characters

### 4.2 Implement Media Module

- [ ] **Create Media module structure**
  - Directory: [`apps/api/src/modules/media/`](apps/api/src/modules/media)
  - Files:
    - `media.module.ts`
    - `media.controller.ts`
    - `media.service.ts`
    - `services/image-generation.service.ts`
    - `services/lora-manager.service.ts`

- [ ] **Implement Image Generation Service**
  - File: [`apps/api/src/modules/media/services/image-generation.service.ts`](apps/api/src/modules/media/services/image-generation.service.ts)
  - Methods:
    - `async generateCharacterImage(characterId, prompt, style)`
    - `async enhancePrompt(characterId, userPrompt)` - Add LoRA trigger words
    - `async saveToStorage(imageBuffer, metadata)` - Upload to CDN/R2
  - Features:
    - Load character's LoRA model
    - Enhance prompt with trigger words
    - Generate image via fal.ai
    - Save to CharacterMedia table

- [ ] **Implement LoRA Manager Service**
  - File: [`apps/api/src/modules/media/services/lora-manager.service.ts`](apps/api/src/modules/media/services/lora-manager.service.ts)
  - Methods:
    - `findByCharacter(characterId)` - Get active LoRA
    - `create(characterId, loraData)` - Register new LoRA
    - `update(loraId, data)` - Update LoRA settings

- [ ] **Create image generation endpoints**
  - `POST /media/generate/image` - Generate character image
    - Request: `{ characterId, prompt, style: 'portrait' | 'full-body' | 'scene' }`
    - Response: `{ imageUrl, thumbnailUrl, metadata }`
  - `GET /media/characters/:id/images` - Get character's gallery

- [ ] **Add CharacterMedia to database**
  - Model: `CharacterMedia` from [`DATABASE_SCHEMA.md`](plans/DATABASE_SCHEMA.md:139)
  - Fields: characterId, type (profile/gallery/video_idle/video_speaking), url, thumbnailUrl

- [ ] **Integrate with credits system**
  - Deduct 10 credits per image generation
  - Check user balance before generating
  - Log transaction in Transaction table

### 4.3 Integrate Text-to-Speech (ElevenLabs - English)

- [ ] **Sign up for ElevenLabs**
  - URL: [elevenlabs.io](https://elevenlabs.io)
  - Create account (10K chars free/month)
  - Get API key

- [ ] **Add environment variables**
  ```
  ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
  ELEVENLABS_MODEL_ID=eleven_multilingual_v2
  ELEVENLABS_STABILITY=0.5
  ELEVENLABS_SIMILARITY_BOOST=0.75
  ```

- [ ] **Install ElevenLabs SDK**
  ```bash
  cd apps/api
  npm install elevenlabs
  ```

- [ ] **Create ElevenLabs integration service**
  - File: [`apps/api/src/integrations/elevenlabs/elevenlabs.service.ts`](apps/api/src/integrations/elevenlabs/elevenlabs.service.ts)
  - Method: `async synthesize({ text, voiceId, stability, similarityBoost }): Promise<Buffer>`

- [ ] **Clone or create voices**
  - Use ElevenLabs Voice Lab
  - Create 2-3 female voices (for Leyla, Ayla)
  - Store voiceId in Character table

### 4.4 Integrate Text-to-Speech (Azure TTS - Azerbaijani)

- [ ] **Create Azure account and Speech Services**
  - URL: [azure.microsoft.com](https://azure.microsoft.com)
  - Free tier: $200 credit
  - Create Speech Services resource

- [ ] **Add environment variables**
  ```
  AZURE_SPEECH_KEY=xxxxxxxxxxxxxxxxxxxxxxx
  AZURE_SPEECH_REGION=eastus
  AZURE_VOICE_AZ_FEMALE=az-AZ-BanuNeural
  AZURE_VOICE_AZ_MALE=az-AZ-BabekNeural
  ```

- [ ] **Install Azure SDK**
  ```bash
  cd apps/api
  npm install microsoft-cognitiveservices-speech-sdk
  ```

- [ ] **Create Azure TTS integration service**
  - File: [`apps/api/src/integrations/azure-tts/azure-tts.service.ts`](apps/api/src/integrations/azure-tts/azure-tts.service.ts)
  - Method: `async synthesize({ text, voice, rate, pitch }): Promise<Buffer>`

### 4.5 Implement Unified TTS Service

- [ ] **Create TTS Service**
  - File: [`apps/api/src/modules/media/services/tts.service.ts`](apps/api/src/modules/media/services/tts.service.ts)
  - Method: `async synthesize({ text, language, characterId, emotion? })`
    - If language === 'az': Use Azure TTS
    - If language === 'en': Use ElevenLabs
    - Get character's voiceId from database
    - Return audio buffer

- [ ] **Create TTS endpoints**
  - `POST /media/generate/voice` - Synthesize voice message
    - Request: `{ text, language, characterId, emotion? }`
    - Response: Audio file URL
  - Save audio to storage (CDN/R2)

- [ ] **Integrate TTS into chat flow**
  - After AI generates text response
  - Automatically generate voice (if credits available)
  - Send audioUrl with message
  - Deduct 3 credits for voice generation

### 4.6 Implement Pseudo-Video Call System

- [ ] **Extend CharacterMedia model**
  - Add video types: `video_idle`, `video_speaking`, `video_listening`
  - Seed with placeholder video URLs

- [ ] **Create Video State Machine Service**
  - File: [`apps/api/src/modules/media/services/video-state.service.ts`](apps/api/src/modules/media/services/video-state.service.ts)
  - States: IDLE, LISTENING, PROCESSING, SPEAKING
  - Methods:
    - `handleUserSpeechStart(conversationId)`
    - `handleUserSpeechEnd(conversationId)`
    - `handleTTSGeneration(conversationId, audioDuration)`
    - `selectVideoSegment(state, duration)`
  - Emit state changes via WebSocket

- [ ] **Add video state events to WebSocket**
  - Event: `video-state-change` - Notify frontend of state transitions
  - Payload: `{ state: 'idle' | 'listening' | 'processing' | 'speaking', videoUrl?, duration? }`

- [ ] **Update chat flow with video states**
  - User starts typing → LISTENING
  - User sends message → PROCESSING
  - TTS generated → SPEAKING (with video URL and duration)
  - TTS ends → IDLE

### 4.7 Build Media UI Components (Web)

- [ ] **Create Image Viewer component**
  - File: [`apps/web/src/components/media/ImageViewer.tsx`](apps/web/src/components/media/ImageViewer.tsx)
  - Display generated images in chat
  - Lightbox for full-size view
  - Loading state during generation

- [ ] **Create Audio Player component**
  - File: [`apps/web/src/components/media/AudioPlayer.tsx`](apps/web/src/components/media/AudioPlayer.tsx)
  - HTML5 audio player
  - Play/pause, seek controls
  - Waveform visualization (optional)

- [ ] **Create Video Call Player component**
  - File: [`apps/web/src/components/video-call/VideoCallPlayer.tsx`](apps/web/src/components/video-call/VideoCallPlayer.tsx)
  - Display character video
  - State-based video switching:
    - IDLE: Loop 5-second idle video
    - LISTENING: Show listening animation/border
    - PROCESSING: Show thinking overlay
    - SPEAKING: Play speaking video segment
  - Smooth transitions with Framer Motion

- [ ] **Create Video State Overlay component**
  - File: [`apps/web/src/components/video-call/VideoStateOverlay.tsx`](apps/web/src/components/video-call/VideoStateOverlay.tsx)
  - Visual indicators for each state
  - Animated border for LISTENING
  - Pulse effect for PROCESSING

- [ ] **Update Chat page with media features**
  - Add "Generate Image" button
  - Display images inline in chat
  - Auto-play voice messages
  - Toggle video call mode

- [ ] **Create Video Call page**
  - File: [`apps/web/src/app/video-call/[conversationId]/page.tsx`](apps/web/src/app/video-call/[conversationId]/page.tsx)
  - Full-screen video player
  - Text chat overlay at bottom
  - Voice input button (placeholder for future)

### 4.8 Set Up Media Storage (CloudFlare R2 or S3)

- [ ] **Sign up for CloudFlare R2**
  - URL: [dash.cloudflare.com](https://dash.cloudflare.com)
  - Create R2 bucket: `ethereal-media`
  - Generate access keys

- [ ] **Add environment variables**
  ```
  CLOUDFLARE_R2_ACCESS_KEY=xxxxxxxxxxxxxxxx
  CLOUDFLARE_R2_SECRET_KEY=xxxxxxxxxxxxxxxx
  CLOUDFLARE_R2_BUCKET=ethereal-media
  CLOUDFLARE_R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
  CLOUDFLARE_CDN_URL=https://cdn.ethereal.app
  ```

- [ ] **Install S3 client (R2 is S3-compatible)**
  ```bash
  cd apps/api
  npm install @aws-sdk/client-s3
  npm install @aws-sdk/s3-request-presigner
  ```

- [ ] **Create Storage Service**
  - File: [`apps/api/src/common/services/storage.service.ts`](apps/api/src/common/services/storage.service.ts)
  - Methods:
    - `async uploadFile(buffer, filename, contentType)`
    - `async getSignedUrl(key, expiresIn)`
    - `async deleteFile(key)`

- [ ] **Integrate storage into media services**
  - Upload generated images to R2
  - Upload TTS audio files to R2
  - Return CDN URLs

### 4.9 Test Multimodal Features

- [ ] **Test image generation**
  - Generate portrait of character
  - Verify image saved to database
  - Verify credits deducted
  - Test different styles (portrait, full-body, scene)

- [ ] **Test voice synthesis (English)**
  - Send English message
  - Verify ElevenLabs voice generated
  - Play audio in UI
  - Check voice quality

- [ ] **Test voice synthesis (Azerbaijani)**
  - Send Azerbaijani message
  - Verify Azure TTS used
  - Test both female and male voices
  - Check pronunciation

- [ ] **Test video call UI**
  - Start video call mode
  - Send message
  - Verify state transitions:
    - IDLE → LISTENING → PROCESSING → SPEAKING → IDLE
  - Check smooth video transitions

- [ ] **Test media storage**
  - Verify files uploaded to R2/S3
  - Check CDN URLs are accessible
  - Test file deletion

### ✅ Slice 4 Deliverables

- [x] fal.ai image generation with LoRA support
- [x] ElevenLabs TTS for English
- [x] Azure TTS for Azerbaijani
- [x] Character image gallery
- [x] Voice messages in chat
- [x] Pseudo-video call with state machine
- [x] Media storage (CloudFlare R2 or S3)
- [x] Credits deduction for media generation
- [x] Complete multimodal UI

---

## 📱 Slice 5: Мобилка и Монетизация (Mobile & Monetization) - Days 18+

**Objective**: Launch React Native mobile app and implement monetization.

**Success Criteria**:
✅ Mobile app on iOS/Android connects to API
✅ In-app purchases working via RevenueCat
✅ Credit system fully functional

### 5.1 Initialize React Native Mobile App

- [ ] **Create Expo project**
  ```bash
  cd apps/mobile
  npx create-expo-app@latest . --template blank-typescript
  ```

- [ ] **Install core dependencies**
  ```bash
  npm install @react-navigation/native @react-navigation/stack
  npm install @react-navigation/bottom-tabs
  npm install react-native-screens react-native-safe-area-context
  npm install axios socket.io-client
  npm install @tanstack/react-query
  npm install zustand
  ```

- [ ] **Configure app.json**
  - File: [`apps/mobile/app.json`](apps/mobile/app.json)
  - Set app name: "Ethereal"
  - Set bundle identifiers:
    - iOS: `com.ethereal.app`
    - Android: `com.ethereal.app`
  - Add icons and splash screen

- [ ] **Set up environment configuration**
  - File: [`apps/mobile/.env`](apps/mobile/.env)
  ```
  API_URL=http://localhost:3001
  WS_URL=ws://localhost:3001
  REVENUECAT_PUBLIC_KEY_IOS=appl_xxxxxxxx
  REVENUECAT_PUBLIC_KEY_ANDROID=goog_xxxxxxxx
  ```

### 5.2 Implement Navigation

- [ ] **Create navigation structure**
  - File: [`apps/mobile/src/navigation/RootNavigator.tsx`](apps/mobile/src/navigation/RootNavigator.tsx)
  - Stack navigator with Auth/Main stacks

- [ ] **Create Auth Navigator**
  - File: [`apps/mobile/src/navigation/AuthNavigator.tsx`](apps/mobile/src/navigation/AuthNavigator.tsx)
  - Screens: Login, Register

- [ ] **Create Main Navigator (Tab Bar)**
  - File: [`apps/mobile/src/navigation/MainNavigator.tsx`](apps/mobile/src/navigation/MainNavigator.tsx)
  - Tabs:
    - Discover (feed of characters)
    - Conversations (list)
    - Profile/Settings

- [ ] **Create nested Chat Stack**
  - Screens: ConversationList, ChatScreen, VideoCallScreen

### 5.3 Implement API Service

- [ ] **Create API client**
  - File: [`apps/mobile/src/services/api.service.ts`](apps/mobile/src/services/api.service.ts)
  - Axios instance with base URL
  - Token management
  - Request/response interceptors

- [ ] **Create WebSocket service**
  - File: [`apps/mobile/src/services/websocket.service.ts`](apps/mobile/src/services/websocket.service.ts)
  - Socket.io client
  - Connection management
  - Event handlers

- [ ] **Create storage service**
  - File: [`apps/mobile/src/services/storage.service.ts`](apps/mobile/src/services/storage.service.ts)
  - Use AsyncStorage for tokens
  - Persist user data

### 5.4 Build Authentication Screens

- [ ] **Create Login Screen**
  - File: [`apps/mobile/src/screens/auth/LoginScreen.tsx`](apps/mobile/src/screens/auth/LoginScreen.tsx)
  - Email/password form
  - Call API login endpoint
  - Store tokens in AsyncStorage

- [ ] **Create Register Screen**
  - File: [`apps/mobile/src/screens/auth/RegisterScreen.tsx`](apps/mobile/src/screens/auth/RegisterScreen.tsx)
  - Registration form
  - Call API register endpoint

- [ ] **Create auth store**
  - File: [`apps/mobile/src/store/auth.store.ts`](apps/mobile/src/store/auth.store.ts)
  - Using Zustand
  - Actions: login, register, logout

### 5.5 Build Main Screens

- [ ] **Create Discover Feed Screen**
  - File: [`apps/mobile/src/screens/discover/DiscoverFeedScreen.tsx`](apps/mobile/src/screens/discover/DiscoverFeedScreen.tsx)
  - FlatList of public characters
  - Horizontal scroll for character images
  - Tap to view details/start conversation

- [ ] **Create Character Detail Screen**
  - File: [`apps/mobile/src/screens/characters/CharacterDetailScreen.tsx`](apps/mobile/src/screens/characters/CharacterDetailScreen.tsx)
  - Display character info
  - Image gallery
  - "Start Conversation" button

- [ ] **Create Conversation List Screen**
  - File: [`apps/mobile/src/screens/chat/ConversationListScreen.tsx`](apps/mobile/src/screens/chat/ConversationListScreen.tsx)
  - List user's conversations
  - Last message preview
  - Swipe to delete

- [ ] **Create Chat Screen**
  - File: [`apps/mobile/src/screens/chat/ChatScreen.tsx`](apps/mobile/src/screens/chat/ChatScreen.tsx)
  - Message list with KeyboardAvoidingView
  - Message input at bottom
  - WebSocket integration
  - Display images, audio inline
  - "Start Video Call" button

- [ ] **Create Video Call Screen**
  - File: [`apps/mobile/src/screens/video-call/VideoCallScreen.tsx`](apps/mobile/src/screens/video-call/VideoCallScreen.tsx)
  - Full-screen video player
  - Similar to web version
  - Chat overlay

- [ ] **Create Settings Screen**
  - File: [`apps/mobile/src/screens/settings/SettingsScreen.tsx`](apps/mobile/src/screens/settings/SettingsScreen.tsx)
  - User profile
  - Language preference
  - Credits balance
  - Subscription status
  - Logout button

### 5.6 Implement Monetization Backend

- [ ] **Add monetization models to database**
  - Models already in schema:
    - `Transaction` - All credit movements
    - `Subscription` - RevenueCat subscriptions
    - `CreditPackage` - Purchasable credit packs

- [ ] **Create Payments module**
  - Directory: [`apps/api/src/modules/payments/`](apps/api/src/modules/payments)
  - Files:
    - `payments.module.ts`
    - `payments.controller.ts`
    - `payments.service.ts`
    - `services/credits.service.ts`
    - `services/subscriptions.service.ts`
    - `services/revenuecat.service.ts`

- [ ] **Implement Credits Service**
  - File: [`apps/api/src/modules/payments/services/credits.service.ts`](apps/api/src/modules/payments/services/credits.service.ts)
  - Methods:
    - `async deductCredits(userId, amount, description)` - Atomic transaction
    - `async addCredits(userId, amount, description)`
    - `async getBalance(userId)`
    - `async getTransactionHistory(userId)`
  - Use Prisma transactions for atomicity

- [ ] **Implement action cost constants**
  - File: [`apps/api/src/modules/payments/constants/action-costs.ts`](apps/api/src/modules/payments/constants/action-costs.ts)
  ```typescript
  export enum ActionCost {
    TEXT_MESSAGE = 1,
    IMAGE_GENERATION = 10,
    VOICE_MESSAGE = 3,
    VIDEO_CALL_PER_MINUTE = 20
  }
  ```

- [ ] **Integrate credits into existing services**
  - Chat Service: Deduct 1 credit per message
  - Image Service: Deduct 10 credits per image
  - TTS Service: Deduct 3 credits per voice message
  - Check balance before action
  - Return error if insufficient credits

- [ ] **Create credit packages**
  - Seed CreditPackage table:
    - Small: 500 credits for $4.99
    - Medium: 1200 credits for $9.99 (20% bonus)
    - Large: 2500 credits for $19.99 (25% bonus)

- [ ] **Create payment endpoints**
  - `GET /payments/credits` - Get balance
  - `GET /payments/history` - Transaction history
  - `GET /payments/packages` - List credit packages
  - `POST /payments/purchase` - Initiate purchase (handled by RevenueCat)

### 5.7 Integrate RevenueCat

- [ ] **Sign up for RevenueCat**
  - URL: [revenuecat.com](https://revenuecat.com)
  - Create account and project
  - Configure app in dashboard

- [ ] **Set up products in app stores**
  
  **iOS (App Store Connect):**
  - Create in-app purchases:
    - `com.ethereal.credits.small` - $4.99
    - `com.ethereal.credits.medium` - $9.99
    - `com.ethereal.credits.large` - $19.99
    - `com.ethereal.premium.monthly` - $9.99/month
    - `com.ethereal.premium.yearly` - $79.99/year
  
  **Android (Google Play Console):**
  - Mirror iOS products
  - Set same product IDs with different prefixes if needed

- [ ] **Add products to RevenueCat**
  - Dashboard → Products
  - Map store product IDs to RevenueCat identifiers
  - Set up entitlements (e.g., "premium")

- [ ] **Get RevenueCat API keys**
  - Public SDK keys (iOS/Android) - for mobile app
  - Secret API key - for backend
  - Webhook URL - for backend

- [ ] **Add environment variables**
  ```
  # Mobile app
  REVENUECAT_PUBLIC_KEY_IOS=appl_xxxxxxxxxx
  REVENUECAT_PUBLIC_KEY_ANDROID=goog_xxxxxxxxxx
  
  # Backend
  REVENUECAT_SECRET_KEY=sk_xxxxxxxxxxxxxxxx
  REVENUECAT_WEBHOOK_SECRET=rc_webhook_xxxxxx
  ```

### 5.8 Implement RevenueCat in Mobile App

- [ ] **Install RevenueCat SDK**
  ```bash
  cd apps/mobile
  npm install react-native-purchases
  npx pod-install  # iOS only
  ```

- [ ] **Initialize RevenueCat**
  - File: [`apps/mobile/src/services/revenuecat.service.ts`](apps/mobile/src/services/revenuecat.service.ts)
  - Configure on app start
  - Set user ID

- [ ] **Create Subscription Screen**
  - File: [`apps/mobile/src/screens/settings/SubscriptionScreen.tsx`](apps/mobile/src/screens/settings/SubscriptionScreen.tsx)
  - Display available packages
  - Show current subscription status
  - "Purchase" buttons
  - Handle purchase flow

- [ ] **Implement purchase logic**
  ```typescript
  import Purchases from 'react-native-purchases';
  
  const purchasePackage = async (packageId: string) => {
    try {
      const purchaseResult = await Purchases.purchasePackage(packageId);
      // Success - credits/subscription activated automatically via webhook
    } catch (e) {
      // Handle errors (user cancelled, etc.)
    }
  };
  ```

- [ ] **Display credits in UI**
  - Show credit balance in header
  - Update after each action
  - Real-time sync with backend

### 5.9 Implement RevenueCat Webhooks (Backend)

- [ ] **Create Webhooks module**
  - Directory: [`apps/api/src/modules/webhooks/`](apps/api/src/modules/webhooks)
  - Files:
    - `webhooks.module.ts`
    - `controllers/revenuecat-webhook.controller.ts`

- [ ] **Create RevenueCat Service**
  - File: [`apps/api/src/modules/payments/services/revenuecat.service.ts`](apps/api/src/modules/payments/services/revenuecat.service.ts)
  - Methods:
    - `async handleInitialPurchase(event)` - Add credits or activate subscription
    - `async handleRenewal(event)` - Extend subscription
    - `async handleCancellation(event)` - Mark subscription cancelled
    - `async handleRefund(event)` - Deduct credits or revoke access

- [ ] **Create webhook endpoint**
  - File: [`apps/api/src/modules/webhooks/controllers/revenuecat-webhook.controller.ts`](apps/api/src/modules/webhooks/controllers/revenuecat-webhook.controller.ts)
  - Route: `POST /webhooks/revenuecat`
  - Verify webhook signature
  - Handle events:
    - `INITIAL_PURCHASE` - New purchase
    - `RENEWAL` - Subscription renewed
    - `CANCELLATION` - Subscription cancelled
    - `UNCANCELLATION` - Subscription reactivated
    - `NON_RENEWING_PURCHASE` - One-time credit purchase

- [ ] **Implement Subscriptions Service**
  - File: [`apps/api/src/modules/payments/services/subscriptions.service.ts`](apps/api/src/modules/payments/services/subscriptions.service.ts)
  - Methods:
    - `async activateSubscription(userId, productId, expiresAt)` - Create/update subscription
    - `async cancelSubscription(userId)` - Mark as cancelled
    - `async reactivateSubscription(userId)` - Uncancel
    - `async checkSubscriptionStatus(userId)` - Check if active
  - Update User.isPremium flag based on subscription status

- [ ] **Configure webhook in RevenueCat**
  - Dashboard → Integrations → Webhooks
  - Add URL: `https://api.yourdomain.com/webhooks/revenuecat`
  - Add webhook secret to environment variables

### 5.10 Test Monetization Flow

- [ ] **Test credit deduction**
  - Send message → Verify 1 credit deducted
  - Generate image → Verify 10 credits deducted
  - Check balance updates in real-time

- [ ] **Test insufficient credits**
  - Set user credits to 0
  - Try to generate image
  - Verify error message displayed
  - Verify action blocked

- [ ] **Test credit purchase (iOS Simulator)**
  - Use Sandbox test user from App Store Connect
  - Purchase credit package
  - Verify webhook received in backend
  - Verify credits added to user account
  - Test all package sizes

- [ ] **Test subscription (iOS Simulator)**
  - Purchase monthly premium
  - Verify subscription activated
  - Verify User.isPremium = true
  - Check unlimited features access

- [ ] **Test subscription cancellation**
  - Cancel subscription in device settings
  - Verify webhook received
  - Verify subscription marked as cancelled
  - Check access after expiry date

- [ ] **Test Android purchases**
  - Set up Google Play test account
  - Test credit purchases
  - Test subscriptions
  - Verify webhooks work identically

### 5.11 Build Discovery Feed

- [ ] **Implement Discover module (backend)**
  - Directory: [`apps/api/src/modules/discover/`](apps/api/src/modules/discover)
  - Files:
    - `discover.module.ts`
    - `discover.controller.ts`
    - `discover.service.ts`

- [ ] **Implement Discover Service**
  - File: [`apps/api/src/modules/discover/discover.service.ts`](apps/api/src/modules/discover/discover.service.ts)
  - Methods:
    - `async getFeed(page, limit, category?)` - Get paginated public characters
    - `async getTrending()` - Get trending characters (by conversation count)
    - `async getCategories()` - List all categories
  - Ranking algorithm:
    - Score = conversationCount * 0.5 + messageCount * 0.3 + avgRating * 0.2
    - Order by score DESC

- [ ] **Create discover endpoints**
  - `GET /discover/feed?page=1&limit=20&category=romance` - Feed
  - `GET /discover/trending` - Trending characters
  - `GET /discover/categories` - Category list

- [ ] **Update mobile Discover Screen**
  - Fetch and display characters
  - Infinite scroll
  - Filter by category
  - Tap to view details

### 5.12 Polish Mobile UI/UX

- [ ] **Add loading states**
  - Skeleton screens for lists
  - Spinner for API calls
  - Streaming message indicators

- [ ] **Add error handling**
  - Network error messages
  - Retry buttons
  - Offline mode detection

- [ ] **Add animations**
  - Screen transitions
  - Message send animation
  - Image loading transitions
  - Pull-to-refresh

- [ ] **Optimize performance**
  - Image caching
  - Message list virtualization
  - Lazy load conversation history

- [ ] **Add push notifications** (optional)
  - Install Expo Notifications
  - Backend: Store device tokens
  - Send notifications for new messages

### 5.13 Prepare for Production

- [ ] **Update environment for production**
  - File: [`apps/mobile/.env.production`](apps/mobile/.env.production)
  ```
  API_URL=https://api.ethereal.app
  WS_URL=wss://api.ethereal.app
  ```

- [ ] **Configure app icons and splash**
  - Design app icon (1024x1024)
  - Design splash screen
  - Use Expo EAS for asset generation

- [ ] **Set up app store listings**
  - App Store Connect (iOS)
  - Google Play Console (Android)
  - Screenshots, descriptions, keywords

- [ ] **Build production bundles**
  ```bash
  # iOS
  eas build --platform ios --profile production
  
  # Android
  eas build --platform android --profile production
  ```

### ✅ Slice 5 Deliverables

- [x] React Native mobile app (iOS + Android)
- [x] Complete navigation structure
- [x] Authentication flow
- [x] Chat functionality identical to web
- [x] RevenueCat integration
- [x] In-app purchases working
- [x] Credit system functional
- [x] Subscription management
- [x] Discovery feed
- [x] Polished UI/UX
- [x] Ready for App Store submission

---

## 📊 Summary Dashboard

### Technology Stack by Slice

| Slice | Frontend | Backend | Database | AI Services | Infrastructure |
|-------|----------|---------|----------|-------------|----------------|
| 1 | Next.js | NestJS | PostgreSQL, Redis | - | Docker Compose |
| 2 | WebSocket Client | WebSocket Gateway | - | Groq, OpenAI | - |
| 3 | Auth UI | Prisma, JWT | Full Schema | OpenAI Embeddings | FastAPI |
| 4 | Media Components | Media Module | CharacterMedia | fal.ai, ElevenLabs, Azure | CloudFlare R2 |
| 5 | React Native | Payments Module | Transaction, Subscription | - | RevenueCat |

### Progress Tracking

**Overall Project Phases:**

```
Phase 1: Foundation (Slice 1)        ◻ Days 1-3   [        ]
Phase 2: Core Chat (Slice 2)         ◻ Days 4-7   [        ]
Phase 3: Memory & DB (Slice 3)       ◻ Days 8-12  [        ]
Phase 4: Multimodal (Slice 4)        ◻ Days 13-17 [        ]
Phase 5: Mobile & Revenue (Slice 5)  ◻ Days 18+   [        ]
```

### Key Milestones

- [ ] **Day 3**: Frontend can ping backend ✓ Infrastructure working
- [ ] **Day 7**: Real-time chat with AI works ✓ Core functionality proven
- [ ] **Day 12**: Persistent conversations with memory ✓ Production-ready backend
- [ ] **Day 17**: Multimodal interactions working ✓ Full-featured web app
- [ ] **Day 25+**: Mobile apps ready for stores ✓ Complete platform

### Critical Path Dependencies

```
Slice 1 → Slice 2 → Slice 3 → Slice 4
                             ↘ Slice 5
```

- **Slices 1-3 are sequential** - Must complete in order
- **Slice 4 depends on Slice 3** - Needs database and auth
- **Slice 5 can start after Slice 3** - Mobile app just needs API endpoints
- **Slice 5 payments can be parallel** - While working on Slice 4 multimodal

### Resource Requirements

**Development Phase:**
- 1-2 Full-stack developers
- Access to all AI service APIs
- Estimated budget: ~$50-100/month for AI services

**Production Phase (1,000 DAU):**
- Infrastructure: $100-150/month
- AI Services: $300-400/month
- Storage/CDN: $50-100/month
- **Total: ~$450-650/month**

---

## 🚀 Quick Start Guide

### For New Developers Joining the Project

1. **Clone and set up**
   ```bash
   git clone <repository-url>
   cd ethereal
   npm install
   ```

2. **Copy environment template**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   # Fill in API keys
   ```

3. **Start infrastructure**
   ```bash
   docker-compose up -d
   ```

4. **Set up database**
   ```bash
   cd packages/database
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start all services**
   ```bash
   # From root
   npm run dev
   
   # Or individually:
   # Terminal 1: cd apps/api && npm run dev
   # Terminal 2: cd apps/web && npm run dev
   # Terminal 3: cd apps/ai-service && uvicorn src.main:app --reload
   ```

6. **Access applications**
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs
   - AI Service: http://localhost:8000

---

## 🔍 Testing Strategy

### Unit Tests
- **Backend**: Jest for NestJS services
- **Frontend**: React Testing Library
- **Coverage target**: 70%+

### Integration Tests
- API endpoint tests
- Database transaction tests
- WebSocket connection tests

### E2E Tests
- **Web**: Playwright
- **Mobile**: Detox
- Critical user flows:
  - Registration → Login → Start conversation → Send message
  - Purchase credits → Generate image → View in gallery
  - Subscribe → Access premium features

### Performance Tests
- Load testing with Artillery
- Target: 100 concurrent users
- Measure: Response time, throughput, error rate

---

## 📚 Additional Resources

### Documentation References
- [`ARCHITECTURE_OVERVIEW.md`](plans/ARCHITECTURE_OVERVIEW.md) - System design and flows
- [`PROJECT_STRUCTURE.md`](plans/PROJECT_STRUCTURE.md) - Detailed folder structure
- [`DATABASE_SCHEMA.md`](plans/DATABASE_SCHEMA.md) - Complete Prisma schema
- [`TECH_STACK_SETUP.md`](plans/TECH_STACK_SETUP.md) - AI service configuration
- [`IMPLEMENTATION_GUIDE.md`](plans/IMPLEMENTATION_GUIDE.md) - Step-by-step coding guide
- [`DEPLOYMENT_GUIDE.md`](plans/DEPLOYMENT_GUIDE.md) - Production deployment

### External Documentation
- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://prisma.io/docs)
- [Expo Docs](https://docs.expo.dev)
- [RevenueCat Docs](https://docs.revenuecat.com)

### Community & Support
- GitHub Issues: For bug reports
- Discord: For real-time discussion
- Wiki: For additional guides

---

## 🎯 Success Metrics

### Development Metrics
- [ ] All Slice 1 tasks completed
- [ ] All Slice 2 tasks completed
- [ ] All Slice 3 tasks completed
- [ ] All Slice 4 tasks completed
- [ ] All Slice 5 tasks completed

### Technical Metrics
- [ ] API response time < 100ms (95th percentile)
- [ ] Text generation first token < 200ms
- [ ] Image generation < 6 seconds
- [ ] WebSocket latency < 50ms
- [ ] Database query time < 50ms
- [ ] Test coverage > 70%

### Business Metrics
- [ ] User registration working
- [ ] Payment processing working
- [ ] Subscription management working
- [ ] Credit system accurate
- [ ] No critical bugs in production

---

## 🛠️ Troubleshooting Common Issues

### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d --force-recreate
```

### Database Issues
```bash
# Reset database
cd packages/database
npx prisma migrate reset
npx prisma db seed
```

### API Connection Issues
- Check CORS settings in [`apps/api/src/main.ts`](apps/api/src/main.ts:1)
- Verify environment variables
- Check firewall rules

### WebSocket Issues
- Verify Socket.io versions match
- Check WebSocket URL format (`ws://` not `http://`)
- Test with Postman WebSocket client

### Build Issues
```bash
# Clean and rebuild
npm run clean  # If available
rm -rf node_modules
npm install
npm run build
```

---

## 📝 Notes and Best Practices

### Code Quality
- Use TypeScript strict mode
- Follow ESLint rules
- Write JSDoc comments for public APIs
- Keep functions small (<50 lines)
- Use meaningful variable names

### Git Workflow
- Create feature branches: `feature/slice-2-chat-mvp`
- Commit after each sub-task completion
- Write descriptive commit messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.

### Security Considerations
- Never commit `.env` files
- Rotate API keys regularly
- Use environment-specific secrets
- Validate all user inputs
- Sanitize data before database insertion
- Use parameterized queries (Prisma handles this)

### Performance Optimization
- Use Redis for caching
- Implement pagination for large lists
- Use database indexes effectively
- Lazy load images
- Debounce API calls
- Use Web Workers for heavy computations

---

## 🎉 Conclusion

This roadmap provides a **complete, actionable plan** for building the Ethereal AI Companion Platform using **Vertical Slicing methodology**. Each slice delivers a working feature that can be tested and validated immediately.

**Key Advantages:**
✅ **Incremental Progress** - See results after each slice
✅ **Risk Mitigation** - Identify issues early
✅ **Flexibility** - Adjust priorities between slices
✅ **Team Collaboration** - Clear task boundaries
✅ **Stakeholder Demos** - Show working features frequently

**Next Steps:**
1. Review this roadmap with the team
2. Set up development environment (Slice 1)
3. Begin implementation following the checklist
4. Track progress by checking off completed tasks
5. Update timeline estimates based on actual velocity

**Remember:** This is a living document. Update it as you progress, discover new requirements, or adjust priorities.

---

**Good luck building Ethereal! 🚀**

*Generated: 2026-04-05*
*Version: 1.0*
*Status: Ready for Implementation*