# @ethereal/database

Shared database package for the Ethereal platform using Prisma ORM with PostgreSQL and pgvector.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure database URL:
```bash
cp .env.example .env
# Edit .env with your Supabase connection string
```

3. Generate Prisma client:
```bash
npm run db:generate
```

4. Push schema to database:
```bash
npm run db:push
```

5. Seed database:
```bash
npm run db:seed
```

## Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio

## Usage in other packages

```typescript
import { PrismaClient } from '@ethereal/database';

const prisma = new PrismaClient();

const users = await prisma.user.findMany();
```

## Supabase Integration

This package is configured to work with Supabase (Cloud PostgreSQL with pgvector extension).

The pgvector extension is enabled for RAG memory functionality.
