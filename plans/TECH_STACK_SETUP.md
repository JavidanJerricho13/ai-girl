# Technology Stack Setup Guide

## Overview

This guide provides detailed instructions for selecting, setting up, and configuring all external services needed for the Ethereal AI Companion Platform.

## AI/ML Services

### 1. Groq API (Primary Text Generation)

**Purpose**: Ultra-fast inference for Llama 3 70B (<200ms first token latency)

**Setup Steps**:
1. Visit [console.groq.com](https://console.groq.com)
2. Create free account (100K tokens/day free tier)
3. Generate API key from dashboard
4. Add to environment: `GROQ_API_KEY=gsk_...`

**Pricing** (as of 2026):
- Llama 3 70B: $0.59 per 1M input tokens, $0.79 per 1M output tokens
- Free tier: Sufficient for early development

**Configuration**:
```typescript
// Backend environment variable
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=llama3-70b-8192
GROQ_MAX_TOKENS=2048
GROQ_TEMPERATURE=0.7
```

**Alternative**: If Groq is unavailable, use **Together.ai** or **Replicate** for Llama 3 models.

---

### 2. OpenAI API (Azerbaijani Language Support)

**Purpose**: GPT-4o-mini for grammatically correct Azerbaijani responses

**Setup Steps**:
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key from API Keys section
4. Add to environment: `OPENAI_API_KEY=sk-...`

**Pricing**:
- GPT-4o-mini: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- Budget estimate: ~$50-100/month for 10K Azerbaijani messages

**Configuration**:
```typescript
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL_AZ=gpt-4o-mini
OPENAI_MAX_TOKENS=1500
OPENAI_TEMPERATURE=0.8
```

---

### 3. fal.ai (Image Generation)

**Purpose**: Flux.1 Dev + LoRA support for consistent character faces

**Setup Steps**:
1. Visit [fal.ai](https://fal.ai)
2. Sign up and verify email
3. Navigate to API Keys section
4. Generate key and add to environment: `FAL_KEY=...`

**Pricing**:
- Flux.1 Dev: ~$0.025 per image (512x512)
- Flux.1 Pro: ~$0.05 per image (higher quality)
- Budget estimate: $100-200/month for 5K images

**Configuration**:
```typescript
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
FAL_MODEL=fal-ai/flux-lora
FAL_DEFAULT_STEPS=28
FAL_GUIDANCE_SCALE=3.5
```

**LoRA Hosting**:
- Host custom LoRA models on HuggingFace
- Reference via URL: `https://huggingface.co/username/model-name`
- Free tier sufficient for hosting

**Alternative**: **Replicate** with Flux.1 or **Stable Diffusion XL** with LoRA support.

---

### 4. ElevenLabs (English TTS)

**Purpose**: High-quality, emotionally expressive English voice synthesis

**Setup Steps**:
1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Create account (10K characters free/month)
3. Go to Profile → API Key
4. Add to environment: `ELEVENLABS_API_KEY=...`
5. Clone or create custom voices in Voice Lab

**Pricing**:
- Starter: $5/month (30K characters)
- Creator: $22/month (100K characters)
- Pro: $99/month (500K characters)
- Budget estimate: $22-99/month depending on usage

**Configuration**:
```typescript
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.75
```

**Voice Creation**:
- Upload 5-10 minutes of clean audio samples
- Train voice in Voice Lab (takes 5-10 minutes)
- Store `voice_id` in Character table

---

### 5. Azure Neural TTS (Azerbaijani Voice)

**Purpose**: Native Azerbaijani voice synthesis with neural quality

**Setup Steps**:
1. Visit [azure.microsoft.com](https://azure.microsoft.com)
2. Create free account ($200 credit)
3. Create Speech Services resource
4. Get Key and Region from Keys and Endpoint section
5. Add to environment:
   ```
   AZURE_SPEECH_KEY=xxxxxxxxxxxxx
   AZURE_SPEECH_REGION=eastus
   ```

**Pricing**:
- Neural voices: $16 per 1M characters
- Free tier: 500K characters/month
- Budget estimate: Free tier sufficient for development

**Available Azerbaijani Voices**:
- `az-AZ-BanuNeural` (Female)
- `az-AZ-BabekNeural` (Male)

**Configuration**:
```typescript
AZURE_SPEECH_KEY=xxxxxxxxxxxxxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus
AZURE_VOICE_AZ_FEMALE=az-AZ-BanuNeural
AZURE_VOICE_AZ_MALE=az-AZ-BabekNeural
```

**Alternative**: **Google Cloud TTS** with Turkish voices as a fallback.

---

### 6. LiveKit (WebRTC Video/Audio)

**Purpose**: Low-latency video call infrastructure

**Setup Steps**:
1. Visit [livekit.io](https://livekit.io)
2. Create account and project
3. Generate API Key and Secret from Settings
4. Deploy LiveKit server or use cloud:
   - **Cloud**: LiveKit Cloud ($0.01/participant-minute)
   - **Self-hosted**: Docker deployment (free, but requires setup)

**Pricing**:
- Free tier: 10K participant minutes/month
- Beyond: $0.01/participant-minute
- Budget estimate: $50-100/month for moderate usage

**Configuration**:
```typescript
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxx
```

**Docker Setup** (self-hosted):
```bash
docker run --rm -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -e LIVEKIT_KEYS="APIkey: secretkey" \
  livekit/livekit-server:latest \
  --dev
```

**Alternative**: **Agora.io** or **Twilio Video** for WebRTC.

---

### 7. Llama-Guard (Content Moderation)

**Purpose**: Filter harmful/inappropriate content

**Setup Options**:

#### Option A: Self-Hosted (Recommended for Control)
1. Use Together.ai or Replicate API
2. Model: `Meta-Llama/LlamaGuard-2-8b`
3. Add API key to environment

```typescript
TOGETHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxx
LLAMAGUARD_MODEL=Meta-Llama/LlamaGuard-2-8b
```

**Pricing** (Together.ai):
- $0.20 per 1M tokens
- Budget estimate: $20-30/month for all moderation

#### Option B: OpenAI Moderation API (Easier)
```typescript
// Use built-in OpenAI moderation endpoint
// Free with OpenAI API key
```

**Configuration**:
```typescript
// Moderation categories
MODERATION_CATEGORIES=violence,sexual,hate_speech,self_harm,illegal
MODERATION_THRESHOLD=0.7
```

---

## Vector Database

### Option 1: Pinecone (Recommended for Simplicity)

**Purpose**: Managed vector database for RAG memory storage

**Setup Steps**:
1. Visit [pinecone.io](https://pinecone.io)
2. Create free account (1M vectors free)
3. Create index:
   - Name: `ethereal-memory`
   - Dimensions: 1536 (for OpenAI embeddings) or 384 (for sentence-transformers)
   - Metric: Cosine
4. Get API key from API Keys section

**Pricing**:
- Free: 1M vectors (sufficient for 10K users)
- Starter: $70/month (5M vectors)

**Configuration**:
```typescript
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=ethereal-memory
EMBEDDING_DIMENSION=1536
```

### Option 2: pgvector (Cost-Effective)

**Purpose**: PostgreSQL extension for vector storage (no additional service)

**Setup Steps**:
1. Use PostgreSQL 15+ with pgvector extension
2. Enable in Docker Compose:
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: ethereal
      POSTGRES_PASSWORD: password
```

3. Enable extension in migration:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_embeddings (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  embedding vector(1536),
  content TEXT,
  created_at TIMESTAMP
);

CREATE INDEX ON memory_embeddings 
  USING ivfflat (embedding vector_cosine_ops);
```

**Configuration**:
```typescript
VECTOR_DB_TYPE=pgvector
PGVECTOR_TABLE=memory_embeddings
```

**Recommendation**: Start with Pinecone for ease, migrate to pgvector if costs become concern.

---

## Embedding Services

### Option 1: OpenAI Embeddings

**Model**: `text-embedding-3-small`

**Pricing**: $0.02 per 1M tokens

**Configuration**:
```typescript
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

### Option 2: Self-Hosted (Free)

**Model**: `sentence-transformers/all-MiniLM-L6-v2`

**Setup**: Run via FastAPI Python service

**Pricing**: Free (but requires compute)

**Configuration**:
```typescript
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=all-MiniLM-L6-v2
EMBEDDING_DIMENSIONS=384
```

---

## Payment Integration

### RevenueCat (Mobile Subscriptions)

**Purpose**: Unified subscription management for iOS/Android

**Setup Steps**:
1. Visit [revenuecat.com](https://revenuecat.com)
2. Create free account (no credit card for dev)
3. Create project and app
4. Set up products in App Store Connect and Google Play Console
5. Add products to RevenueCat dashboard
6. Get public SDK keys and webhook URL

**Pricing**:
- Free: Up to $10K monthly tracked revenue
- Growth: 1% of revenue above $10K

**Configuration**:
```typescript
// Mobile apps
REVENUECAT_PUBLIC_KEY_IOS=appl_xxxxxxxxxx
REVENUECAT_PUBLIC_KEY_ANDROID=goog_xxxxxxxxxx

// Backend webhook
REVENUECAT_WEBHOOK_SECRET=rc_webhook_xxxxxx
```

**Products to Create**:
1. Monthly Premium: $9.99/month
2. Yearly Premium: $79.99/year (save 33%)
3. Credit Pack Small: $4.99 (500 credits)
4. Credit Pack Large: $19.99 (2500 credits)

---

## Infrastructure Services

### 1. PostgreSQL Database

**Local Development**:
```yaml
# docker-compose.yml
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
```

**Production Options**:
- **Supabase**: $25/month (managed PostgreSQL + pgvector)
- **Neon**: Serverless PostgreSQL, $19/month
- **AWS RDS**: From $15/month

### 2. Redis

**Local Development**:
```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
```

**Production Options**:
- **Upstash**: Serverless Redis, pay-per-request ($0.20/100K commands)
- **Redis Cloud**: From $5/month
- **AWS ElastiCache**: From $13/month

---

## CDN & Media Storage

### CloudFlare (Recommended)

**Purpose**: CDN for media delivery + R2 storage

**Setup**:
1. Create CloudFlare account
2. Add domain (free plan sufficient)
3. Enable R2 storage for media files
4. Create access keys

**Pricing**:
- CDN: Free for unlimited traffic
- R2 Storage: $0.015/GB-month
- Budget estimate: $5-20/month for media storage

**Configuration**:
```typescript
CLOUDFLARE_R2_ACCESS_KEY=xxxxxxxxxx
CLOUDFLARE_R2_SECRET_KEY=xxxxxxxxxx
CLOUDFLARE_R2_BUCKET=ethereal-media
CLOUDFLARE_CDN_URL=https://cdn.ethereal.app
```

**Alternative**: **AWS S3 + CloudFront** or **Vercel Blob Storage**

---

## Development Environment Summary

### Essential Services (MVP)
```bash
# Required immediately
✅ Groq API - Text generation
✅ OpenAI API - Azerbaijani support + embeddings
✅ PostgreSQL - Database
✅ Redis - Caching/queues

# Required for full features
✅ fal.ai - Image generation
✅ Azure TTS - Azerbaijani voice
✅ ElevenLabs - English voice

# Optional (can defer)
⏳ LiveKit - Video calls (use placeholder videos first)
⏳ Pinecone - Vector DB (use pgvector initially)
⏳ RevenueCat - Mobile payments (implement later)
```

### Total Estimated Costs

**Development Phase** (Low usage):
- Groq: Free tier
- OpenAI: ~$10/month
- fal.ai: ~$20/month
- ElevenLabs: $5/month
- Azure TTS: Free tier
- **Total: ~$35/month**

**Production Phase** (1,000 daily active users):
- Text Generation: $100-150/month
- Image Generation: $150-200/month
- Voice: $50-100/month
- Database/Infrastructure: $50-100/month
- CDN/Storage: $20-50/month
- **Total: ~$370-600/month**

---

## Environment Variables Template

Create [``.env.example``](.env.example) file:

```bash
# Database
DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/ethereal
REDIS_URL=redis://localhost:6379

# AI Services - Text
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# AI Services - Image
FAL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# AI Services - Voice
ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxx
AZURE_SPEECH_KEY=xxxxxxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus

# Vector Database
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=ethereal-memory

# Content Moderation
TOGETHER_API_KEY=xxxxxxxxxxxxxxxx

# Video/Audio
LIVEKIT_URL=wss://project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxx

# Payments
REVENUECAT_PUBLIC_KEY_IOS=appl_xxxxxxxx
REVENUECAT_PUBLIC_KEY_ANDROID=goog_xxxxxxxx
REVENUECAT_WEBHOOK_SECRET=rc_webhook_xxxxxxxx

# Storage
CLOUDFLARE_R2_ACCESS_KEY=xxxxxxxxxxxxxxxx
CLOUDFLARE_R2_SECRET_KEY=xxxxxxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET=ethereal-media

# App Config
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Feature Flags
ENABLE_NSFW=true
ENABLE_VIDEO_CALLS=false
ENABLE_PAYMENTS=false
```

---

## Service Setup Priority

### Phase 1: Core Chat (Week 1-2)
1. PostgreSQL + Redis setup
2. Groq API for English
3. OpenAI API for Azerbaijani
4. Basic moderation

### Phase 2: Multimodal (Week 3-4)
5. fal.ai for images
6. Azure TTS for Azerbaijani voice
7. ElevenLabs for English voice

### Phase 3: Advanced Features (Week 5+)
8. Pinecone or pgvector for RAG
9. LiveKit for video calls
10. RevenueCat for payments
11. CloudFlare for CDN

---

## Testing Credentials

For local development without real API keys, use mock services:

```typescript
// config/mock-services.ts
export const MOCK_MODE = process.env.NODE_ENV === 'development' && 
                         process.env.USE_MOCKS === 'true';

if (MOCK_MODE) {
  // Return fake responses for testing
  console.warn('⚠️  Running in MOCK mode - AI services disabled');
}
```

This allows development without incurring API costs during initial setup.

---

## Next Steps

1. Create accounts for essential services (Groq, OpenAI, PostgreSQL)
2. Copy environment variables template
3. Fill in actual API keys
4. Test each service connection with simple API call
5. Proceed to project structure setup

See **[`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)** for folder organization.
