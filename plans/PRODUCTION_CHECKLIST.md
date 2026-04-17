# Ethereal — Production Launch Checklist

> **Date:** 2026-04-17
> **Status:** NOT READY — 18 critical blockers, 12 warnings
> **Estimated work:** 5 days to production-ready MVP
> **Priority:** Stability > Security > Infrastructure > Launch

---

## Current Readiness Score

| Module | Code Complete | Production Ready | Blockers |
|--------|:------------:|:---------------:|----------|
| **API** | 90% | NO | Empty keys, auth logging, CORS |
| **Web** | 85% | NO | Hardcoded socket URL, no deploy config |
| **Admin** | 80% | NO | localStorage tokens, localhost links |
| **Mobile** | 75% | NO | Placeholder keys, no EAS, no store accounts |
| **Database** | 95% | Almost | Credential rotation needed |
| **Infrastructure** | 0% | NO | No CI/CD, no Docker, no deploy config |

---

## Phase 1: Secrets & Security (Day 1)

> _Every credential exposed in dev must be rotated before ANY deployment._

### 1.1 — Rotate Compromised Credentials

| Secret | Current State | Action |
|--------|--------------|--------|
| Supabase DB password | Visible in `apps/api/.env` | Rotate in Supabase Dashboard → Settings → Database |
| GROQ API key | Visible in `apps/api/.env` | Rotate in console.groq.com → API Keys |
| JWT_SECRET | Dev-format string | Generate: `openssl rand -hex 32` |

**After rotation, update in:**
- `apps/api/.env`
- `packages/database/.env`
- Production secret manager (Vercel env vars / Railway secrets)

### 1.2 — Obtain Missing Production Keys

| Key | Where to get | Set in |
|-----|-------------|--------|
| `STRIPE_SECRET_KEY` | stripe.com → Developers → API keys | `apps/api/.env` |
| `STRIPE_WEBHOOK_SECRET` | stripe.com → Webhooks → Signing secret | `apps/api/.env` |
| `REVENUECAT_WEBHOOK_AUTH_KEY` | app.revenuecat.com → Project → Webhooks | `apps/api/.env` |
| `REVENUECAT_API_KEY_IOS` | app.revenuecat.com → Project → API Keys | `revenuecat.service.ts` → move to env |
| `REVENUECAT_API_KEY_ANDROID` | app.revenuecat.com → Project → API Keys | `revenuecat.service.ts` → move to env |
| `FAL_KEY` | fal.ai → Dashboard → API Keys | `apps/api/.env` |
| `ELEVENLABS_API_KEY` | elevenlabs.io → Profile → API Keys | `apps/api/.env` |
| `AZURE_SPEECH_KEY` | Azure Portal → Speech Services | `apps/api/.env` |
| `AZURE_SPEECH_REGION` | Azure Portal → Speech Services | `apps/api/.env` |
| `R2_ENDPOINT` | Cloudflare Dashboard → R2 → Bucket | `apps/api/.env` |
| `R2_ACCESS_KEY_ID` | Cloudflare Dashboard → R2 → API Tokens | `apps/api/.env` |
| `R2_SECRET_ACCESS_KEY` | Cloudflare Dashboard → R2 → API Tokens | `apps/api/.env` |
| `R2_BUCKET_NAME` | Cloudflare Dashboard → R2 → Bucket name | `apps/api/.env` |
| `R2_PUBLIC_URL` | Cloudflare Dashboard → R2 → Public domain | `apps/api/.env` |

### 1.3 — Create Real Stripe Products

Current placeholder price IDs in `apps/api/src/modules/payments/stripe.service.ts`:

| Product | Placeholder ID | Action |
|---------|---------------|--------|
| Premium Monthly | `price_premium_monthly` | Create in Stripe Dashboard → Products |
| Premium Yearly | `price_premium_yearly` | Create in Stripe Dashboard |
| Credits 500 | `price_credits_small` | Create in Stripe Dashboard |
| Credits 1200 | `price_credits_medium` | Create in Stripe Dashboard |
| Credits 2500 | `price_credits_large` | Create in Stripe Dashboard |
| First Purchase | `price_first_purchase` | Create in Stripe Dashboard |

Replace all placeholder IDs with real `price_xxxx` IDs from Stripe.

### 1.4 — Remove Auth Debug Logging

**File:** `apps/api/src/modules/auth/auth.service.ts` (lines 87-126)

Remove or guard with log level:
```typescript
// REMOVE these console.log lines:
console.log(`[Auth] User found: ${user.email}, hash starts with: ${user.passwordHash.substring(0, 10)}...`);
console.log(`[Auth] bcrypt.compare result: ${isPasswordValid}`);
console.log(`[Auth] Login failed: password mismatch for ${user.email}`);
```

**Risk if not done:** Email addresses and password hash prefixes logged to stdout in production.

### 1.5 — Implement RevenueCat Webhook Verification

**File:** `apps/api/src/modules/payments/payments.controller.ts`

Currently marked as TODO — without this, anyone can POST a webhook and grant themselves premium.

```typescript
private verifyWebhookAuth(authorization: string | undefined): void {
  const expectedKey = this.configService.get('REVENUECAT_WEBHOOK_AUTH_KEY');
  if (!expectedKey) {
    throw new BadRequestException('Webhook auth not configured');
  }
  if (authorization !== `Bearer ${expectedKey}`) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
}
```

---

## Phase 2: Fix Hardcoded URLs (Day 1)

> _Every localhost reference must be replaced with environment variables._

### 2.1 — Web App

| File | Line | Current | Replace with |
|------|------|---------|-------------|
| `apps/web/src/app/(app)/chat/page.tsx` | 46 | `io('http://localhost:3001')` | `io(process.env.NEXT_PUBLIC_WS_URL \|\| 'http://localhost:3001')` |
| `apps/web/src/lib/api-client.ts` | 13 | fallback `localhost:3001/api` | OK (has env var) |
| `apps/web/src/app/(app)/layout.tsx` | 28 | fallback `localhost:3001/api` | OK (has env var) |

**New env var needed:** `NEXT_PUBLIC_WS_URL=wss://api.ethereal.app`

### 2.2 — Admin App

| File | Line | Current | Replace with |
|------|------|---------|-------------|
| `components/characters/CharacterTable.tsx` | 256 | `http://localhost:3000/characters/${id}` | `${process.env.NEXT_PUBLIC_WEB_URL}/characters/${id}` |
| `components/characters/CharacterForm.tsx` | 662 | `http://localhost:3000/characters/${id}` | same pattern |
| `app/(admin)/characters/[id]/page.tsx` | 298 | `http://localhost:3000/characters/${id}` | same pattern |
| `components/layout/SidebarNav.tsx` | 111 | `http://localhost:3000` | `process.env.NEXT_PUBLIC_WEB_URL \|\| '/'` |

**New env var needed:** `NEXT_PUBLIC_WEB_URL=https://ethereal.app`

### 2.3 — API CORS

**File:** `apps/api/.env`

```env
# Development:
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# Production:
CORS_ORIGIN=https://ethereal.app,https://admin.ethereal.app
```

### 2.4 — Mobile App

**Files:** `api.service.ts`, `websocket.service.ts`

Current dev IPs (`192.168.31.98`) are already guarded by `__DEV__` check.
Production URLs (`https://api.ethereal.app`) are already set as fallback.

**Action:** Verify production URLs are correct domain. No code change needed.

### 2.5 — Move RevenueCat Keys to Environment

**File:** `apps/mobile/src/services/revenuecat.service.ts`

```typescript
// BEFORE (hardcoded placeholder):
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key';

// AFTER (environment variable):
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID || '';
```

---

## Phase 3: Deployment Infrastructure (Days 2-3)

> _Without deployment configs, code cannot reach production._

### 3.1 — API Dockerfile

**Create:** `apps/api/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api
RUN npm ci --workspace=apps/api --workspace=packages/database
RUN cd packages/database && npx prisma generate
RUN cd apps/api && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database ./packages/database
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 3.2 — GitHub Actions CI/CD

**Create:** `.github/workflows/deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run db:generate
      - run: cd apps/api && npm run build
      # Deploy to Railway/Fly.io/Render

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Deploy to separate Vercel project
```

### 3.3 — Vercel Configuration

**Web app — create:** `apps/web/vercel.json`

```json
{
  "buildCommand": "cd ../.. && npm run db:generate && cd apps/web && npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.ethereal.app/api",
    "NEXT_PUBLIC_WS_URL": "wss://api.ethereal.app"
  }
}
```

### 3.4 — Domain Setup

| Domain | Service | Purpose |
|--------|---------|---------|
| `ethereal.app` | Vercel (Web) | Main web application |
| `admin.ethereal.app` | Vercel (Admin) | Admin dashboard |
| `api.ethereal.app` | Railway/Fly.io (API) | Backend API + WebSocket |

### 3.5 — Environment Variables Per Platform

**Vercel (Web):**
```
NEXT_PUBLIC_API_URL=https://api.ethereal.app/api
NEXT_PUBLIC_WS_URL=wss://api.ethereal.app
```

**Vercel (Admin):**
```
NEXT_PUBLIC_API_URL=https://api.ethereal.app/api
NEXT_PUBLIC_WEB_URL=https://ethereal.app
```

**Railway/Fly.io (API):**
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<new-strong-secret>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
GROQ_API_KEY=<new-key>
OPENAI_API_KEY=<optional>
FAL_KEY=<key>
ELEVENLABS_API_KEY=<key>
AZURE_SPEECH_KEY=<key>
AZURE_SPEECH_REGION=<region>
R2_ENDPOINT=<endpoint>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET_NAME=<bucket>
R2_PUBLIC_URL=<url>
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<secret>
REVENUECAT_WEBHOOK_AUTH_KEY=<key>
CORS_ORIGIN=https://ethereal.app,https://admin.ethereal.app
PORT=3001
NODE_ENV=production
```

---

## Phase 4: Mobile Store Submission (Days 3-4)

> _App stores have strict requirements beyond "code works."_

### 4.1 — Apple App Store Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Apple Developer Account ($99/year) | NOT SET UP | Register at developer.apple.com |
| App ID + Bundle ID (`com.ethereal.app`) | Configured in app.json | Verify in Apple Developer Portal |
| App Store Connect listing | NOT CREATED | Create app, set name, category |
| Screenshots (6.7", 6.5", 5.5") | NOT CREATED | Generate via Simulator |
| App description | NOT WRITTEN | Write 170-char subtitle + 4000-char description |
| Privacy Policy URL | NOT CREATED | Create and host at ethereal.app/privacy |
| Terms of Service URL | NOT CREATED | Create and host at ethereal.app/terms |
| App Review Information | NOT PREPARED | Demo account, notes for reviewer |
| Age Rating | 17+ (AI chat, potential NSFW) | Set in App Store Connect |
| In-App Purchase config | NOT SET UP | Create IAP products in App Store Connect |
| Push Notification certificate | NOT SET UP | Create in Apple Developer Portal |
| Firebase config (GoogleService-Info.plist) | NOT CREATED | Set up Firebase project |

### 4.2 — Google Play Store Requirements

| Requirement | Status | Action |
|-------------|--------|--------|
| Google Play Console ($25 one-time) | NOT SET UP | Register at play.google.com/console |
| App listing | NOT CREATED | Create app, set name, category |
| Screenshots (phone + tablet) | NOT CREATED | Generate via emulator |
| Feature graphic (1024x500) | NOT CREATED | Design in Figma |
| Privacy Policy URL | Same as iOS | Host at ethereal.app/privacy |
| Content rating questionnaire | NOT COMPLETED | Complete in Play Console |
| Target audience declaration | NOT COMPLETED | 17+ (AI companion) |
| Firebase config (google-services.json) | NOT CREATED | Set up Firebase project |
| Signing key (upload key) | NOT CREATED | EAS Build handles this |

### 4.3 — EAS Build Configuration

**Create:** `apps/mobile/eas.json`

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.ethereal.app/api",
        "EXPO_PUBLIC_REVENUECAT_IOS": "<real-key>",
        "EXPO_PUBLIC_REVENUECAT_ANDROID": "<real-key>"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<apple-id>",
        "ascAppId": "<app-store-connect-app-id>",
        "appleTeamId": "<team-id>"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json"
      }
    }
  }
}
```

**Build commands:**
```bash
# First build
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 4.4 — Firebase Project Setup

1. Go to console.firebase.google.com
2. Create project "Ethereal"
3. Add iOS app (Bundle ID: `com.ethereal.app`)
   - Download `GoogleService-Info.plist` → `apps/mobile/`
4. Add Android app (Package: `com.ethereal.app`)
   - Download `google-services.json` → `apps/mobile/`
5. Enable Cloud Messaging (for push notifications)
6. Add Firebase config to `app.json`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

---

## Phase 5: Monitoring & Observability (Day 4)

### 5.1 — Error Tracking (Sentry)

| App | Package | Setup |
|-----|---------|-------|
| API | `@sentry/node` | Init in main.ts, capture exceptions |
| Web | `@sentry/nextjs` | Init in next.config.js |
| Mobile | `@sentry/react-native` | Already scaffolded in lib/errorTracking.ts |

**Sentry DSN needed from:** sentry.io → Create project → Settings → DSN

### 5.2 — Uptime Monitoring

| Endpoint | Expected | Monitor with |
|----------|----------|-------------|
| `api.ethereal.app/api/health` | `{"status":"ok"}` | UptimeRobot / Better Uptime |
| `ethereal.app` | HTTP 200 | UptimeRobot |
| `admin.ethereal.app` | HTTP 200 | UptimeRobot |

### 5.3 — Structured Logging

Replace `console.log` in API with proper logger:

```typescript
// Use NestJS Logger (already available)
private readonly logger = new Logger(ClassName.name);

// Instead of: console.log(`[Auth] Login for ${email}`)
// Use: this.logger.log(`Login attempt`, { email: '***' })
```

### 5.4 — Database Monitoring

- Enable Supabase Dashboard monitoring
- Set up alerts for: connection pool exhaustion, slow queries, disk usage
- Configure automatic backups (Supabase Pro plan includes this)

---

## Phase 6: Pre-Launch Legal & Compliance (Day 5)

### 6.1 — Legal Pages Required

| Page | URL | Content |
|------|-----|---------|
| Privacy Policy | `/privacy` | Data collected, GDPR rights, AI disclosure |
| Terms of Service | `/terms` | Usage rules, content policy, payment terms |
| EULA | In-app | Required for App Store (in-app purchases) |
| Cookie Policy | `/cookies` | For web app (EU requirement) |

### 6.2 — AI-Specific Compliance

| Requirement | Status | Action |
|-------------|--------|--------|
| Disclose AI nature of characters | Not explicit | Add "AI Character" badge |
| Age verification gate | ✅ Implemented | AgeGate component exists |
| NSFW double-key | ✅ Implemented | User + Character flags |
| Data deletion (GDPR) | NOT IMPLEMENTED | Add `DELETE /users/me` endpoint |
| Export user data (GDPR) | NOT IMPLEMENTED | Add `GET /users/me/export` endpoint |

### 6.3 — App Store Review Preparation

**Common rejection reasons for AI chat apps:**
1. Missing age gate → ✅ Already have AgeGate
2. No content moderation → ✅ Already have ModerationService
3. Unclear AI disclosure → ⚠️ Need explicit "AI Character" labels
4. Missing privacy policy → ❌ Need to create
5. Subscription terms unclear → ⚠️ Need to add to app

**Prepare for reviewer:**
- Demo account credentials
- Explanation of AI chat features
- Moderation system description
- Privacy policy URL

---

## Summary: 5-Day Launch Sprint

| Day | Focus | Deliverables |
|-----|-------|-------------|
| **Day 1** | Secrets + URLs | All keys rotated, localhost replaced, auth logging removed |
| **Day 2** | Infrastructure | Dockerfile, Vercel config, Railway setup, domains |
| **Day 3** | Deploy + Mobile | API deployed, Web deployed, EAS first build, Firebase |
| **Day 4** | Monitoring + Testing | Sentry, uptime checks, manual QA pass |
| **Day 5** | Legal + Submit | Privacy policy, terms, App Store listing, submit for review |

### After Launch

- [ ] Monitor Sentry for crashes (first 48h critical)
- [ ] Watch Supabase dashboard for query performance
- [ ] Respond to App Store review feedback (usually 24-48h)
- [ ] Set up analytics dashboards (retention, conversion)
- [ ] Plan v1.1 based on user feedback

---

## Appendix A: Environment Variable Reference

### API (.env)
```env
# Database
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Auth
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AI Services
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
FAL_KEY=...
ELEVENLABS_API_KEY=...
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=eastus

# Storage
R2_ENDPOINT=https://....r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ethereal
R2_PUBLIC_URL=https://....r2.dev

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REVENUECAT_WEBHOOK_AUTH_KEY=...

# App
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://ethereal.app,https://admin.ethereal.app
ENGAGEMENT_SCHEDULER_DISABLED=false
```

### Web (.env.local / Vercel)
```env
NEXT_PUBLIC_API_URL=https://api.ethereal.app/api
NEXT_PUBLIC_WS_URL=wss://api.ethereal.app
```

### Admin (.env.local / Vercel)
```env
NEXT_PUBLIC_API_URL=https://api.ethereal.app/api
NEXT_PUBLIC_WEB_URL=https://ethereal.app
```

### Mobile (EAS / .env)
```env
EXPO_PUBLIC_API_URL=https://api.ethereal.app/api
EXPO_PUBLIC_REVENUECAT_IOS=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID=goog_...
```
