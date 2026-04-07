# Ethereal AI Companion Platform

A next-generation AI companion platform built with a modern monorepo architecture.

## 🏗️ Project Structure

```
ethereal/
├── apps/
│   ├── api/          # NestJS API Gateway (Port 3001)
│   ├── web/          # Next.js Web App (Port 3000)
│   ├── ai-service/   # FastAPI ML Service (Port 8000)
│   └── mobile/       # React Native (Expo)
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared React components
│   └── utils/        # Shared utilities
└── docker-compose.yml # PostgreSQL + Redis
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ethereal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start infrastructure**
   ```bash
   docker-compose up -d
   ```

4. **Start development servers**
   ```bash
   # Start all services with Turbo
   npm run dev

   # Or start individually:
   # Terminal 1 - API
   cd apps/api && npm run dev

   # Terminal 2 - Web
   cd apps/web && npm run dev
   ```

5. **Access the applications**
   - Web App: http://localhost:3000
   - API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

## 📋 Current Status: Slice 1 - Skeleton & Ping

✅ Monorepo structure with Turborepo
✅ Docker Compose (PostgreSQL + Redis)
✅ NestJS API with health endpoint
✅ Next.js Web with ping functionality
✅ CORS configured
✅ End-to-end communication working

### Testing Slice 1

1. Ensure Docker services are running:
   ```bash
   docker-compose ps
   ```

2. Start the API:
   ```bash
   cd apps/api
   npm install
   npm run dev
   ```

3. In a new terminal, start the web app:
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 and click "Ping Backend"
   - You should see a success message with backend health status

## 🛠️ Tech Stack

### Backend
- **NestJS** - API Gateway framework
- **PostgreSQL** - Main database with pgvector
- **Redis** - Caching and sessions
- **Prisma** - Database ORM

### Frontend
- **Next.js 14** - Web framework with App Router
- **React 18** - UI library
- **TailwindCSS** - Styling
- **Axios** - HTTP client

### Infrastructure
- **Turborepo** - Monorepo build system
- **Docker Compose** - Local development environment

## 📖 Documentation

- [Roadmap](ROADMAP.md) - Complete implementation roadmap
- [Project Structure](plans/PROJECT_STRUCTURE.md) - Detailed folder structure
- [Implementation Guide](plans/IMPLEMENTATION_GUIDE.md) - Step-by-step guide
- [Database Schema](plans/DATABASE_SCHEMA.md) - Prisma schema documentation

## 🔄 Development Workflow

```bash
# Install all dependencies
npm install

# Start all services in development mode
npm run dev

# Build all apps
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🐳 Docker Services

The `docker-compose.yml` provides:

- **PostgreSQL 15** with pgvector extension (Port 5432)
- **Redis 7** (Port 6379)

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset everything (⚠️ deletes data)
docker-compose down -v
```

## 📝 Environment Variables

### API (`apps/api/.env`)
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:dev_password@localhost:5432/ethereal
REDIS_URL=redis://localhost:6379
```

### Web (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🗺️ Next Steps

After completing Slice 1, proceed to:

- **Slice 2**: Core Chat MVP with AI integration
- **Slice 3**: Database & Memory (RAG) integration
- **Slice 4**: Multimodal features (images & voice)
- **Slice 5**: Mobile app & monetization

See [ROADMAP.md](ROADMAP.md) for detailed implementation plan.

## 📄 License

Private - All Rights Reserved

## 🤝 Contributing

This is a private project. Contact the project owner for access.
