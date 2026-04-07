# Ethereal AI Companion Platform - Architecture Documentation

## 📋 Overview

This directory contains comprehensive architecture and implementation documentation for the Ethereal AI Companion Platform - a high-performance, multimodal AI companion system with Azerbaijani language support.

## 🗂️ Documentation Structure

### 1. [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)
**Core system architecture and design decisions**

- Complete system architecture with detailed diagrams
- Technology stack breakdown
- Core modules and their interactions
- AI/ML integration strategies
- Text generation with language routing (Groq + OpenAI)
- RAG memory pipeline architecture
- Image generation with LoRA support
- Pseudo-video call state machine
- Multi-language TTS implementation
- Content moderation system
- Monetization architecture
- Discovery feed design
- Performance targets and security considerations

### 2. [TECH_STACK_SETUP.md](TECH_STACK_SETUP.md)
**Service selection and API setup guide**

- Detailed setup instructions for all AI services
- Groq API (Llama 3 70B for English)
- OpenAI API (GPT-4o-mini for Azerbaijani)
- fal.ai (Flux.1 image generation)
- ElevenLabs (English TTS)
- Azure Neural TTS (Azerbaijani voice)
- LiveKit (WebRTC video/audio)
- Llama-Guard (content moderation)
- Vector database options (Pinecone vs pgvector)
- Embedding services
- RevenueCat (mobile subscriptions)
- Infrastructure services (PostgreSQL, Redis, CDN)
- Cost estimates for development and production
- Environment variables template

### 3. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
**Monorepo organization and folder structure**

- Complete monorepo structure with Turborepo
- Backend services (NestJS API + FastAPI AI service)
- Frontend applications (Next.js web + React Native mobile)
- Shared packages (database, types, UI, utils)
- Module organization and file layout
- Docker Compose configuration
- Development workflow
- Build and deployment structure

### 4. [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)
**Step-by-step development roadmap**

- Phase-by-phase implementation plan
- Phase 1: Foundation setup (monorepo, database, Docker)
- Phase 2: Backend API gateway (NestJS modules)
- Phase 3: AI integration services (text, RAG, image, TTS)
- Phase 4: WebSocket and real-time communication
- Phase 5: Web frontend (Next.js)
- Phase 6: Mobile app (React Native)
- Phase 7: Python AI service (FastAPI)
- Phase 8: Testing and optimization
- Code examples for each module
- Testing strategies
- Development commands reference
- Troubleshooting common issues

### 5. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
**Complete database design with Prisma**

- Full Prisma schema for all tables
- User management and authentication
- Character system with personality attributes
- LoRA model management
- Conversation and message storage
- RAG memory summaries
- Monetization (credits, transactions, subscriptions)
- Analytics and moderation logs
- Media generation jobs
- Performance indexes (including pgvector)
- Seed data examples
- Query examples and patterns
- Performance optimization tips
- Backup strategies

### 6. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
**Production deployment and scaling**

- Deployment phases (local → staging → production)
- Cloud platform options:
  - AWS ECS + Fargate (serverless containers)
  - Google Cloud Platform GKE (Kubernetes)
  - Vercel + Serverless (hybrid approach)
- Terraform/IaC configurations
- Kubernetes manifests
- Database migration strategies
- Horizontal and vertical scaling
- Monitoring and observability setup
- Disaster recovery procedures
- CI/CD pipeline (GitHub Actions)
- Cost optimization strategies
- Security checklist
- Launch checklist
- Troubleshooting guide

---

## 🚀 Quick Start

### For Architects/Planners
1. Start with [`ARCHITECTURE_OVERVIEW.md`](ARCHITECTURE_OVERVIEW.md) to understand the system
2. Review [`TECH_STACK_SETUP.md`](TECH_STACK_SETUP.md) for service requirements
3. Check [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for code organization

### For Developers
1. Read [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md) for step-by-step instructions
2. Reference [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) while building features
3. Follow [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for file placement

### For DevOps/Infrastructure
1. Review [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for deployment strategies
2. Check [`TECH_STACK_SETUP.md`](TECH_STACK_SETUP.md) for infrastructure services
3. Set up monitoring as described in [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)

---

## 🎯 Key Features

### Multi-Language Support
- **English**: Groq API (Llama 3 70B) - <200ms response time
- **Azerbaijani**: OpenAI GPT-4o-mini - grammatically correct responses
- Automatic language detection and routing

### Multimodal Content
- **Text**: Streaming responses with RAG memory
- **Images**: Flux.1 with LoRA for face consistency
- **Voice**: ElevenLabs (EN) + Azure TTS (AZ)
- **Video**: Pseudo-video call with state machine

### Advanced AI Features
- RAG memory pipeline (short-term + long-term)
- Vector embeddings with Pinecone/pgvector
- Context-aware conversations
- LoRA model management for consistent characters
- Content moderation with Llama-Guard

### Business Features
- Credit-based monetization
- Mobile subscriptions via RevenueCat
- Discovery feed (Instagram-like)
- Character marketplace
- Usage analytics

---

## 📊 Architecture at a Glance

```
┌─────────────┐  ┌─────────────┐
│  Next.js    │  │   React     │
│   Web App   │  │   Native    │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                │
         ┌──────▼──────┐
         │   NestJS    │
         │  API Gateway│
         └──────┬──────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼────┐  ┌──▼────┐  ┌──▼────┐
│FastAPI │  │Postgres│  │Redis  │
│AI Svc  │  │+pgvector│  │Cache  │
└────────┘  └────────┘  └───────┘
    │
┌───┴────────────────────────┐
│  External AI Services:     │
│  • Groq (Llama 3)         │
│  • OpenAI (GPT-4o-mini)   │
│  • fal.ai (Flux.1)        │
│  • ElevenLabs TTS         │
│  • Azure TTS              │
│  • LiveKit                │
└────────────────────────────┘
```

---

## 💰 Cost Estimates

### Development Phase (~$35/month)
- Groq: Free tier
- OpenAI: ~$10/month
- fal.ai: ~$20/month
- ElevenLabs: $5/month
- Other services: Free tiers

### Production Phase (~$370-600/month for 1K DAU)
- Text Generation: $100-150/month
- Image Generation: $150-200/month
- Voice: $50-100/month
- Infrastructure: $50-100/month
- CDN/Storage: $20-50/month

---

## 🔧 Technology Stack Summary

**Backend**
- Node.js + NestJS (TypeScript)
- Python + FastAPI (ML processing)
- PostgreSQL + Prisma ORM
- Redis (cache/queues)
- WebSockets (Socket.io)

**Frontend**
- Next.js 14+ (Web)
- React Native + Expo (Mobile)
- TailwindCSS, Framer Motion
- Zustand (state management)

**AI/ML**
- Groq API (Llama 3 70B)
- OpenAI (GPT-4o-mini)
- fal.ai (Flux.1 + LoRA)
- ElevenLabs + Azure TTS
- Pinecone/pgvector (RAG)

**Infrastructure**
- Docker + Docker Compose
- Kubernetes (production)
- CloudFlare CDN
- AWS/GCP (cloud)

---

## 📝 Development Phases

1. **Foundation** (Days 1-3): Monorepo, database, Docker setup
2. **Backend Core** (Days 4-7): NestJS API with core modules
3. **AI Integration** (Days 8-12): Text, RAG, image, voice services
4. **Real-time** (Days 13-14): WebSockets and streaming
5. **Web Frontend** (Days 15-20): Next.js application
6. **Mobile App** (Days 21-25): React Native application
7. **Python AI** (Days 26-28): FastAPI ML service
8. **Testing** (Days 29-30): Optimization and security

---

## 🎓 Learning Resources

- **NestJS**: [docs.nestjs.com](https://docs.nestjs.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **React Native**: [reactnative.dev](https://reactnative.dev)
- **FastAPI**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Groq**: [console.groq.com/docs](https://console.groq.com/docs)
- **fal.ai**: [fal.ai/docs](https://fal.ai/docs)

---

## ⚡ Performance Targets

- Text Response (First Token): **< 200ms**
- Image Generation: **3-6 seconds**
- TTS Generation: **< 1 second**
- API Response Time: **< 100ms**
- WebSocket Latency: **< 50ms**
- Database Queries: **< 50ms**
- Uptime: **> 99.9%**

---

## 🔐 Security Features

- JWT authentication with refresh tokens
- Rate limiting (100 req/min per user)
- Content moderation (Llama-Guard)
- SQL injection prevention (Prisma)
- XSS protection
- HTTPS/TLS everywhere
- Encrypted secrets
- GDPR compliance ready

---

## 📞 Next Steps

1. **Review Documentation**: Read through all guides in order
2. **Set Up Services**: Create accounts and get API keys
3. **Initialize Project**: Follow [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md)
4. **Build Incrementally**: Complete one phase before moving to next
5. **Test Thoroughly**: Validate each component works correctly
6. **Deploy**: Use [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for production

---

## 📄 Document Change Log

| Date | Document | Changes |
|------|----------|---------|
| 2026-04-05 | All | Initial architecture documentation created |

---

## 🤝 Contributing

This is an architectural planning document. When implementing:

1. Follow the structure defined in these documents
2. Update documentation if architecture changes
3. Keep code aligned with architectural decisions
4. Document deviations from the plan with reasoning

---

**Ready to build?** Start with [`IMPLEMENTATION_GUIDE.md`](IMPLEMENTATION_GUIDE.md) Phase 1! 🚀
