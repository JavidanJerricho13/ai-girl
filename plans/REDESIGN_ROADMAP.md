# Ethereal — UX/UI Overhaul & Performance Roadmap

> **Date:** 2026-04-17
> **Baseline:** Post-audit of `/discover`, `/chat`, `/gallery`, `/profile` + infrastructure
> **Target:** Awwwards SOTD-quality UI, Lighthouse 95+, sub-1.2s LCP, conversion-optimized flows
> **Principle:** "Nocturnal Intimacy" — each module is a different room in the experience

---

## Phase 0: Critical Infrastructure (Days 1–3)

> _Zero visual changes. Fix the pipes that every subsequent phase depends on._

### 0.1 — Backend Pagination (ALL list endpoints)

**Why first:** Every list view (Discover, Gallery, Conversations) returns ALL records. Nothing else matters if the API dumps 500 characters in one response.

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/modules/characters/characters.controller.ts` | Add `@Query('limit')`, `@Query('offset')` with `ParseIntPipe` + `DefaultValuePipe(20)` |
| `apps/api/src/modules/characters/characters.service.ts` | Add `take: limit`, `skip: offset` to `findAll()` Prisma query |
| `apps/api/src/modules/media/media.controller.ts` | Add `@Query('limit')`, `@Query('offset')`, `@Query('type')` to `getHistory()` |
| `apps/api/src/modules/media/services/image-generation.service.ts` | Add `skip` param to `getGenerationHistory()`, remove hardcoded `type: 'image'` |

**Implementation:**

```typescript
// characters.controller.ts
@Get()
findAll(
  @Query('category') category?: string,
  @Query('search') search?: string,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
) {
  return this.charactersService.findAll({ category, search, limit, offset });
}

// characters.service.ts — inside findMany
take: Math.min(limit, 50),   // cap at 50 to prevent abuse
skip: offset,
orderBy: { conversationCount: 'desc' },
```

**Validation:**
- [ ] `GET /characters?limit=5&offset=0` returns exactly 5 items
- [ ] `GET /characters?limit=5&offset=5` returns next 5 (no overlap)
- [ ] `GET /media/generate/history?type=voice&limit=10` filters correctly
- [ ] Frontend "Load More" appends unique items, no duplicates

---

### 0.2 — Database Index Optimization

**Files to change:**

| File | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add composite indexes |

**New indexes:**

```prisma
model Character {
  // ... existing fields ...

  @@index([isPublic, conversationCount(sort: Desc)])   // discover sort
  @@index([isPublic, category])                         // category filter
  @@index([createdBy, isPublic])                        // user's characters
}

model GenerationJob {
  // ... existing fields ...

  @@index([userId, type, createdAt(sort: Desc)])        // gallery history
}

model Message {
  // ... existing fields ...

  @@index([conversationId, createdAt(sort: Desc)])      // chat scroll
}
```

**Run:** `npx prisma migrate dev --name add-composite-indexes`

---

### 0.3 — WebSocket Security Hardening

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/modules/conversations/conversations.gateway.ts` | Restrict CORS origin |
| `apps/api/src/main.ts` | Add `ThrottlerModule` for rate limiting |

```typescript
// conversations.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
```

```typescript
// app.module.ts — add to imports
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([{
  ttl: 60_000,    // 1 minute window
  limit: 30,      // 30 requests per minute per IP
}]),
```

**Validation:**
- [ ] WebSocket connections from unauthorized origins are rejected
- [ ] API returns 429 after 30 rapid requests from same IP
- [ ] Normal chat flow (1 msg/5s) never triggers throttle

---

### 0.4 — `next/image` Migration + R2 Remote Patterns

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/next.config.js` | Add `images.remotePatterns` for R2 domain |
| `apps/web/src/components/character/CharacterCard.tsx` | Replace `<img>` with `<Image>` |
| `apps/web/src/components/media/GalleryItem.tsx` | Replace `<img>` with `<Image>` |
| `apps/web/src/components/chat/InlineImage.tsx` | Replace `<img>` with `<Image>` |
| `apps/web/src/components/character/CharacterHero.tsx` | Replace `<img>` with `<Image>` |
| `apps/web/src/app/_landing/HeroPortrait.tsx` | Replace `<img>` with `<Image>` |

```javascript
// next.config.js
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 31_536_000,
  remotePatterns: [
    { protocol: 'https', hostname: '**.r2.dev' },
    { protocol: 'https', hostname: '**.cloudflare.com' },
    // add actual R2 public domain here
  ],
},
```

```tsx
// CharacterCard.tsx — example replacement
import Image from 'next/image';

<div className="relative aspect-[3/4] overflow-hidden">
  <Image
    src={profileImage.url}
    alt={character.displayName}
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    className="object-cover transition-transform duration-300 group-hover:scale-105"
    placeholder="blur"
    blurDataURL={profileImage.thumbnailUrl || FALLBACK_BLUR}
    loading="lazy"
  />
</div>
```

**Blur placeholder generation (backend):**

```typescript
// storage.service.ts — add method
async generateBlurHash(imageBuffer: Buffer): Promise<string> {
  const sharp = require('sharp');
  const { data, info } = await sharp(imageBuffer)
    .resize(4, 4, { fit: 'cover' })
    .toFormat('png')
    .toBuffer({ resolveWithObject: true });
  return `data:image/png;base64,${data.toString('base64')}`;
}
```

Store the blur data URL in `CharacterMedia.thumbnailUrl` on upload.

**Validation:**
- [ ] All images serve as AVIF on supported browsers (check Network tab)
- [ ] Blur placeholder visible during load (throttle to Slow 3G)
- [ ] No layout shift — images have explicit dimensions via `fill` + `aspect-ratio` container
- [ ] Lighthouse LCP drops below 1.5s on /discover

---

## Phase 1: Design System Foundation (Days 4–7)

> _Build the visual language before touching any pages._

### 1.1 — Fluid Typography Scale

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/globals.css` | Add CSS custom properties for fluid type |
| `apps/web/tailwind.config.ts` | Extend `fontSize` with fluid values |

```css
/* globals.css — add to :root */
:root {
  --step--1: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);    /* caption */
  --step-0:  clamp(0.875rem, 0.8rem + 0.25vw, 1rem);       /* body */
  --step-1:  clamp(1.125rem, 1rem + 0.5vw, 1.375rem);      /* subhead */
  --step-2:  clamp(1.5rem, 1.2rem + 1vw, 2.25rem);         /* section */
  --step-3:  clamp(2rem, 1.5rem + 2vw, 3.5rem);            /* hero */
  --step-4:  clamp(2.75rem, 2rem + 3vw, 5rem);             /* display */
}
```

```typescript
// tailwind.config.ts — extend fontSize
fontSize: {
  'fluid-xs':  'var(--step--1)',
  'fluid-sm':  'var(--step-0)',
  'fluid-base':'var(--step-1)',
  'fluid-lg':  'var(--step-2)',
  'fluid-xl':  'var(--step-3)',
  'fluid-2xl': 'var(--step-4)',
},
```

**Rule:** Fraunces (display serif) used ONLY at `fluid-xl` and `fluid-2xl`. Inter for everything else. When users see serif, it's a moment.

---

### 1.2 — Glassmorphism Utility Classes

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/globals.css` | Add glass component classes |

```css
/* globals.css — add to @layer components */
@layer components {
  .glass {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
  }

  .glass-hover {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
  }

  .glass-card {
    background: linear-gradient(
      135deg,
      rgba(139, 127, 255, 0.06),
      rgba(232, 180, 160, 0.03)
    );
    border: 1px solid rgba(139, 127, 255, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .glass-accent {
    background: linear-gradient(
      135deg,
      rgba(139, 127, 255, 0.12),
      rgba(232, 180, 160, 0.06)
    );
    border: 1px solid rgba(139, 127, 255, 0.18);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 32px rgba(0, 0, 0, 0.3);
  }
}
```

---

### 1.3 — Chat Background Noise Texture

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/globals.css` | Add noise texture CSS |

```css
/* globals.css */
.bg-noise {
  position: relative;
}
.bg-noise::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px;
}
```

Apply `bg-noise` to the chat message area for tactile depth.

---

### 1.4 — Animation Primitives (Framer Motion)

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/lib/motion.ts` | Shared animation variants + spring configs |

```typescript
// motion.ts
export const spring = {
  gentle: { type: 'spring', stiffness: 200, damping: 25 } as const,
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as const,
  bouncy: { type: 'spring', stiffness: 500, damping: 20 } as const,
};

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
};

export const fadeBlur = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.3 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

export const stagger = (delay = 0.05) => ({
  animate: { transition: { staggerChildren: delay } },
});
```

---

### 1.5 — Drop GSAP, Replace with Framer Motion

**Why:** Saves ~60KB. GSAP is only used for ScrollTrigger on the landing page and CreditBadge spring animation.

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/lib/gsap.ts` | Delete |
| `apps/web/src/components/credits/CreditBadge.tsx` | Replace GSAP spring with Framer `useSpring` |
| Landing page sections using ScrollTrigger | Replace with Framer `useInView` + `useScroll` |
| `apps/web/package.json` | Remove `gsap` dependency |
| `apps/web/next.config.js` | Remove `gsap` from `optimizePackageImports` |

```tsx
// CreditBadge.tsx — replace GSAP spring counter
import { useSpring, animated } from 'framer-motion';

const springCredits = useSpring(credits, { stiffness: 100, damping: 20 });
// Render: <motion.span>{Math.round(springCredits.get())}</motion.span>
```

```tsx
// Landing sections — replace ScrollTrigger
import { useInView } from 'framer-motion';

const ref = useRef(null);
const isInView = useInView(ref, { once: true, margin: '-80px' });

<motion.section
  ref={ref}
  initial={{ opacity: 0, y: 40 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
>
```

**Validation:**
- [ ] `npm ls gsap` shows no results
- [ ] Landing page scroll animations still work
- [ ] CreditBadge counter still animates on credit change
- [ ] Bundle size reduced by ~55-65KB (check with `ANALYZE=true npm run build`)

---

## Phase 2: Chat Module Overhaul (Days 8–14)

> _Chat is where retention lives. This is the highest-leverage module._

### 2.1 — True LLM Streaming

**Why:** Current system blocks 1-3s waiting for full Groq response, then fake-streams chunks. Users feel the delay.

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/integrations/groq/groq.service.ts` | Enable `stream: true`, return async generator |
| `apps/api/src/modules/chat/services/model-router.service.ts` | Consume stream, yield tokens as `ChatEvent` |
| `apps/api/src/modules/chat/chat.service.ts` | Adapt `processMessage()` to yield real-time tokens |

```typescript
// groq.service.ts
async *generateStream(params: {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  tools?: ToolDefinition[];
}): AsyncGenerator<LlmStreamEvent> {
  const stream = await this.client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: params.systemPrompt },
      ...params.messages,
    ],
    temperature: 0.85,
    max_tokens: 1024,
    tools: params.tools?.length ? params.tools : undefined,
    stream: true,
  });

  let toolCallBuffer: Record<number, { name: string; args: string }> = {};

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield { kind: 'text-delta', content: delta.content };
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (!toolCallBuffer[tc.index]) {
          toolCallBuffer[tc.index] = { name: tc.function?.name || '', args: '' };
        }
        if (tc.function?.arguments) {
          toolCallBuffer[tc.index].args += tc.function.arguments;
        }
      }
    }
  }

  // Yield completed tool calls
  for (const tc of Object.values(toolCallBuffer)) {
    yield { kind: 'tool-call', name: tc.name, arguments: JSON.parse(tc.args) };
  }
}
```

**Keep the double-text effect:** After streaming completes, apply the 10% double-text split logic post-hoc. The user sees tokens immediately, but the "second text" arrives after a 2s gap.

**Validation:**
- [ ] First token visible in chat within 300ms of sending message
- [ ] Tool calls (media generation) still trigger correctly
- [ ] Double-text effect still fires ~10% of the time
- [ ] Typing indicator shown during the initial connection phase, then replaced by streaming tokens

---

### 2.2 — Message List Virtualization + Memoization

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/chat/MessageList.tsx` | Add `@tanstack/react-virtual`, memoize bubbles |
| `apps/web/package.json` | Add `@tanstack/react-virtual` dependency |

```tsx
// MessageList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const MessageBubble = memo(function MessageBubble({ message, isOwn }) {
  // ... existing render logic
}, (prev, next) => (
  prev.message.id === next.message.id &&
  prev.message.content === next.message.content
));

export function MessageList({ messages, isTyping }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length + (isTyping ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (i < messages.length ? 80 : 48),
    overscan: 8,
  });

  // Auto-scroll only if near bottom
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setUserScrolledUp(!atBottom);
  }, []);

  useEffect(() => {
    if (!userScrolledUp) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end', behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div ref={parentRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => (
          <div
            key={vItem.key}
            style={{
              position: 'absolute',
              top: vItem.start,
              width: '100%',
            }}
            ref={virtualizer.measureElement}
            data-index={vItem.index}
          >
            {vItem.index < messages.length ? (
              <MessageBubble message={messages[vItem.index]} ... />
            ) : (
              <TypingIndicator />
            )}
          </div>
        ))}
      </div>

      {/* "New messages" jump-to-bottom button */}
      {userScrolledUp && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => virtualizer.scrollToIndex(messages.length - 1, { align: 'end' })}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 glass-accent rounded-full px-4 py-2 text-sm"
        >
          New messages ↓
        </motion.button>
      )}
    </div>
  );
}
```

**Validation:**
- [ ] 200-message thread scrolls at 60fps (Chrome DevTools Performance tab)
- [ ] Scrolling up to read history doesn't jump when new message arrives
- [ ] "New messages ↓" button appears when scrolled up, disappears when at bottom
- [ ] Memory usage stays flat regardless of conversation length

---

### 2.3 — Message Entry Animation

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/chat/MessageList.tsx` | Wrap new messages in `motion.div` with `fadeBlur` |

```tsx
// Only animate the LAST message (new arrival), not all messages
<motion.div
  initial={isNewMessage ? { opacity: 0, y: 8, filter: 'blur(4px)' } : false}
  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
>
  <MessageBubble ... />
</motion.div>
```

---

### 2.4 — Enhanced Typing Indicator

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/chat/TypingIndicator.tsx` | Two visual states: "thinking" + "typing" |

```tsx
// TypingIndicator.tsx — dual-state
export function TypingIndicator({ phase = 'thinking' }: { phase: 'thinking' | 'typing' }) {
  if (phase === 'thinking') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 glass rounded-2xl rounded-bl-md w-fit">
        <motion.div
          className="w-4 h-4 rounded-full border-2 border-lilac/40 border-t-lilac"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-xs text-gray-500">thinking...</span>
      </div>
    );
  }

  // "typing" phase — waveform dots
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 glass rounded-2xl rounded-bl-md w-fit">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-lilac/60 rounded-full"
          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}
```

**Wire to events:** Show `phase="thinking"` on `message-typing` event, switch to `phase="typing"` on first `message-chunk` event.

---

### 2.5 — Chat Layout: Asymmetric Split

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/chat/page.tsx` | Restructure layout to narrow rail + wide chat |
| `apps/web/src/components/chat/ConversationList.tsx` | Collapsible rail: 60px icons / 280px expanded |

```tsx
// chat/page.tsx — layout restructure
<div className="flex h-full">
  {/* Conversation rail — collapsible */}
  <motion.aside
    animate={{ width: railExpanded ? 280 : 64 }}
    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    className="shrink-0 border-r border-white/5 overflow-hidden"
  >
    <ConversationList
      expanded={railExpanded}
      onToggle={() => setRailExpanded(!railExpanded)}
      conversations={conversations}
      activeId={activeConversationId}
      onSelect={handleSelectConversation}
    />
  </motion.aside>

  {/* Main chat area */}
  <div className="flex-1 flex flex-col min-w-0 bg-noise">
    <ChatWindow ... />
  </div>
</div>
```

**Mobile:** On screens < 768px, conversation list becomes a full-screen overlay triggered by a hamburger icon. No rail.

---

### 2.6 — Connection State Indicator

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/chat/page.tsx` | Track socket connection state |
| `apps/web/src/components/chat/ChatWindow.tsx` | Render connection status dot |

```tsx
// page.tsx — track connection state
const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'offline'>('connecting');

useEffect(() => {
  socket.on('connect', () => setConnectionState('connected'));
  socket.on('disconnect', () => setConnectionState('reconnecting'));
  socket.on('reconnect_failed', () => setConnectionState('offline'));
  socket.io.on('reconnect_attempt', () => setConnectionState('reconnecting'));
}, [socket]);

// ChatWindow.tsx — render in header
<div className="flex items-center gap-2">
  <div className={cn(
    'w-2 h-2 rounded-full transition-colors',
    connectionState === 'connected' && 'bg-emerald-400',
    connectionState === 'reconnecting' && 'bg-amber-400 animate-pulse',
    connectionState === 'offline' && 'bg-red-400',
    connectionState === 'connecting' && 'bg-gray-400 animate-pulse',
  )} />
  {connectionState !== 'connected' && (
    <span className="text-fluid-xs text-gray-500 capitalize">{connectionState}</span>
  )}
</div>
```

---

## Phase 3: Discover Module Redesign (Days 15–21)

> _Transform the catalog into a courtship._

### 3.1 — Bento Grid Layout

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/character/CharacterGrid.tsx` | Replace uniform grid with bento layout |
| `apps/web/src/components/character/CharacterCard.tsx` | Support `size` prop: `'standard'` / `'spotlight'` |

```tsx
// CharacterGrid.tsx — bento layout
export function CharacterGrid({ characters }: { characters: Character[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-auto">
      {characters.map((character, i) => {
        // Every 7th card is a spotlight (spans 2 columns)
        const isSpotlight = i % 7 === 0 && i > 0;

        return (
          <motion.div
            key={character.id}
            className={cn(
              isSpotlight && 'col-span-2 row-span-1',
            )}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: Math.min(i * 0.04, 0.3) }}
          >
            <CharacterCard
              character={character}
              size={isSpotlight ? 'spotlight' : 'standard'}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
```

**Spotlight card:** 2:1 aspect ratio, shows personality tags, first greeting message preview, and larger image. Standard card stays at 3:4 portrait.

---

### 3.2 — Card Hover Micro-interactions

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/character/CharacterCard.tsx` | Spring hover + info reveal |

```tsx
// CharacterCard.tsx — premium hover
<motion.div
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
  className="group relative overflow-hidden rounded-2xl glass-card cursor-pointer"
>
  <div className={cn(
    'relative overflow-hidden',
    size === 'spotlight' ? 'aspect-[2/1]' : 'aspect-[3/4]'
  )}>
    <Image ... />

    {/* Gradient overlay — intensifies on hover */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                    opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

    {/* Info overlay — slides up on hover */}
    <div className="absolute bottom-0 left-0 right-0 p-4">
      <h3 className="text-white font-semibold truncate">{character.displayName}</h3>
      <p className="text-gray-300 text-sm line-clamp-2 mt-1">{character.description}</p>

      {/* Tags — only visible on hover */}
      <motion.div
        className="flex flex-wrap gap-1.5 mt-2 overflow-hidden"
        initial={{ height: 0, opacity: 0 }}
        whileInView={{ height: 'auto', opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        {character.tags?.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-lilac/15 text-lilac/80">
            {tag}
          </span>
        ))}
      </motion.div>
    </div>
  </div>

  {/* Stats bar */}
  <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
    <span className="flex items-center gap-1">
      <MessageSquare size={12} /> {character._count?.conversations}
    </span>
    <span className="flex items-center gap-1">
      <Star size={12} /> {character.avgRating?.toFixed(1) || '—'}
    </span>
  </div>
</motion.div>
```

---

### 3.3 — "For You" Personality Recommendations

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/modules/characters/characters.controller.ts` | Add `GET /characters/recommended` endpoint |
| `apps/web/src/app/(app)/discover/page.tsx` | Add "For You" section above main grid |

```typescript
// characters.controller.ts
@Get('recommended')
@UseGuards(JwtAuthGuard)
getRecommended(@Request() req) {
  return this.charactersService.findMatches(req.user.userId);
}
```

```tsx
// discover/page.tsx — "For You" section
const { data: recommended } = useQuery({
  queryKey: ['characters', 'recommended'],
  queryFn: () => apiClient.get('/characters/recommended').then(r => r.data),
  staleTime: 10 * 60 * 1000,
});

{recommended?.length > 0 && (
  <section className="mb-8">
    <h2 className="font-display text-fluid-lg text-white mb-4">For You</h2>
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
      {recommended.map(char => (
        <div key={char.id} className="snap-start shrink-0 w-[260px]">
          <CharacterCard character={char} size="standard" />
          <div className="mt-2 text-center">
            <span className="text-xs text-lilac/70">{char.matchScore}% match</span>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
```

---

### 3.4 — Category Chips with Result Counts

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/modules/characters/characters.service.ts` | Add `countByCategory()` method |
| `apps/api/src/modules/characters/characters.controller.ts` | Add `GET /characters/counts` endpoint |
| `apps/web/src/components/character/CategoryChips.tsx` | Show count badge per category |

```typescript
// characters.service.ts
async countByCategory(): Promise<Record<string, number>> {
  const counts = await this.prisma.character.groupBy({
    by: ['category'],
    where: { isPublic: true },
    _count: true,
  });
  // Flatten array-type category into counts map
  // ... implementation
}
```

---

## Phase 4: Gallery Module Redesign (Days 22–26)

> _Gallery is a curated exhibition, not a file browser._

### 4.1 — True Masonry with Variable Column Count

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/media/GalleryGrid.tsx` | 2→3→4→5 column progression |

```tsx
// GalleryGrid.tsx
<div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      className="break-inside-avoid"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.03, 0.25) }}
    >
      <GalleryItem item={item} />
    </motion.div>
  ))}
</div>
```

---

### 4.2 — Shared Layout Lightbox Transition

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/media/GalleryItem.tsx` | Add `layoutId` |
| `apps/web/src/components/media/ImageLightbox.tsx` | Use `layoutId` for morph transition |
| `apps/web/src/app/(app)/gallery/page.tsx` | Wrap in `AnimatePresence` + `LayoutGroup` |

```tsx
// GalleryItem.tsx
<motion.div layoutId={`gallery-${item.id}`} className="...">
  <Image ... />
</motion.div>

// ImageLightbox.tsx
<motion.div
  className="fixed inset-0 z-50 flex items-center justify-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

  <motion.div layoutId={`gallery-${item.id}`} className="relative z-10 max-w-[90vw] max-h-[85vh]">
    <Image
      src={item.resultUrl}
      alt={item.prompt}
      width={item.width || 1024}
      height={item.height || 1024}
      className="rounded-xl object-contain"
      priority
    />
  </motion.div>

  {/* Info sidebar — desktop only */}
  <motion.aside
    initial={{ x: 40, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: 0.15 }}
    className="hidden lg:flex flex-col w-80 glass rounded-xl p-6 ml-6"
  >
    {/* prompt, date, download, share */}
  </motion.aside>
</motion.div>

// gallery/page.tsx
import { LayoutGroup, AnimatePresence } from 'framer-motion';

<LayoutGroup>
  <GalleryGrid items={allItems} onItemClick={setSelectedItem} />
  <AnimatePresence>
    {selectedItem && (
      <ImageLightbox item={selectedItem} onClose={() => setSelectedItem(null)} />
    )}
  </AnimatePresence>
</LayoutGroup>
```

**Effect:** Clicking a gallery thumbnail makes the image morph seamlessly into the full-screen lightbox. No jarring modal pop-in.

---

### 4.3 — Backend: Image Compression Pipeline

**Files to change:**

| File | Change |
|------|--------|
| `apps/api/src/common/services/storage.service.ts` | Add `uploadOptimizedImage()` method |
| `apps/api/src/modules/media/services/image-generation.service.ts` | Use optimized upload |
| `apps/api/package.json` | Add `sharp` dependency |

```typescript
// storage.service.ts
async uploadOptimizedImage(
  rawBuffer: Buffer,
  characterId?: string,
): Promise<{ fullUrl: string; thumbUrl: string; blurDataUrl: string }> {
  const sharp = require('sharp');

  // Full-size WebP (quality 85, ~60-80% smaller than PNG)
  const fullBuffer = await sharp(rawBuffer)
    .webp({ quality: 85 })
    .toBuffer();

  // Thumbnail for cards (400px wide, quality 75)
  const thumbBuffer = await sharp(rawBuffer)
    .resize(400, null, { fit: 'inside' })
    .webp({ quality: 75 })
    .toBuffer();

  // Blur placeholder (4x4 pixel)
  const blurBuffer = await sharp(rawBuffer)
    .resize(4, 4, { fit: 'cover' })
    .png()
    .toBuffer();

  const folder = characterId ? `images/characters/${characterId}` : 'images';
  const timestamp = Date.now();

  const [full, thumb] = await Promise.all([
    this.uploadFile(fullBuffer, folder, `${timestamp}.webp`, 'image/webp'),
    this.uploadFile(thumbBuffer, folder, `${timestamp}-thumb.webp`, 'image/webp'),
  ]);

  return {
    fullUrl: full.url,
    thumbUrl: thumb.url,
    blurDataUrl: `data:image/png;base64,${blurBuffer.toString('base64')}`,
  };
}
```

**Impact:** Images go from ~200-400KB PNG to ~40-80KB WebP. Thumbnails ~10-15KB. Blur placeholders ~200 bytes.

---

## Phase 5: Profile Module Redesign (Days 27–31)

> _Profile is a mirror, not a data dump._

### 5.1 — Activate Disabled Features

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/profile/page.tsx` | Wire activity stats to real API data |
| `apps/api/src/modules/users/users.controller.ts` | Add `GET /users/stats` endpoint |
| `apps/api/src/modules/users/users.service.ts` | Implement stats query |

```typescript
// users.service.ts
async getUserStats(userId: string) {
  const [conversations, messages, images] = await Promise.all([
    this.prisma.conversation.count({ where: { userId } }),
    this.prisma.message.count({
      where: { conversation: { userId }, role: 'user' },
    }),
    this.prisma.generationJob.count({
      where: { userId, type: 'image', status: 'COMPLETED' },
    }),
  ]);
  return { conversations, messages, images };
}
```

---

### 5.2 — Profile Editing

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/profile/page.tsx` | Add inline edit mode for displayName, bio |
| `apps/api/src/modules/users/users.controller.ts` | Add `PATCH /users/profile` endpoint |

```tsx
// profile/page.tsx — inline edit pattern
const [editing, setEditing] = useState(false);
const [draft, setDraft] = useState({ displayName: '', bio: '' });

const saveProfile = useMutation({
  mutationFn: (data) => apiClient.patch('/users/profile', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    setEditing(false);
  },
});

// Render: tap name → inline input, tap save → PATCH request
```

---

### 5.3 — Editorial Single-Column Layout

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/(app)/profile/page.tsx` | Restructure to editorial layout |

```tsx
// profile/page.tsx — editorial layout
<div className="max-w-lg mx-auto space-y-8 py-8">
  {/* Avatar + Name — large, centered */}
  <section className="text-center">
    <div className="w-24 h-24 rounded-full mx-auto mb-4 glass-accent overflow-hidden">
      <Image src={profile.avatar} ... />
    </div>
    <h1 className="font-display text-fluid-xl text-white">{displayName}</h1>
    <p className="text-fluid-xs text-gray-500 mt-1">Member since {memberSince}</p>
    {profile.isPremium && (
      <span className="inline-block mt-2 text-[10px] font-semibold text-yellow-400 bg-yellow-900/30 px-3 py-1 rounded-full">
        PRO — expires {formatDate(profile.premiumUntil)}
      </span>
    )}
  </section>

  {/* Stats — horizontal scroll of glass cards */}
  <section className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
    {stats.map(stat => (
      <div key={stat.label} className="snap-start shrink-0 w-28 glass-card rounded-xl p-4 text-center">
        <stat.icon size={18} className="text-lilac mx-auto mb-1.5" />
        <p className="text-lg font-semibold text-white">{stat.value}</p>
        <p className="text-fluid-xs text-gray-500">{stat.label}</p>
      </div>
    ))}
  </section>

  {/* Credits card */}
  <section className="glass-accent rounded-2xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-fluid-xs text-gray-400">Credit Balance</p>
        <p className="text-fluid-lg font-semibold text-white">{credits.toLocaleString()}</p>
      </div>
      <Link href="/credits" className="text-sm text-lilac hover:text-lilac/80 transition-colors">
        Top Up →
      </Link>
    </div>
  </section>

  {/* Menu — clean list */}
  <section className="glass rounded-xl divide-y divide-white/5">
    <MenuItem href="/credits" icon={Clock} label="Transaction History" />
    <MenuItem href="/settings" icon={Settings} label="Settings" />
    <MenuItem onClick={handleLogout} icon={LogOut} label="Sign Out" destructive />
  </section>
</div>
```

---

### 5.4 — Enable Credit Purchase Flow

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/components/credits/PackageCard.tsx` | Remove `disabled` from purchase buttons |
| `apps/web/src/app/(app)/credits/page.tsx` | Wire purchase to Stripe checkout |

```tsx
// PackageCard.tsx — enable purchase
<button
  onClick={() => handlePurchase(pkg.priceId)}
  className="w-full py-2.5 rounded-lg text-sm font-medium glass-accent
             text-white hover:brightness-110 transition-all"
>
  {pkg.price}
</button>
```

```tsx
// credits/page.tsx — Stripe checkout
const handlePurchase = async (priceId: string) => {
  const { data } = await apiClient.post('/payments/stripe/checkout', {
    priceId,
    successUrl: `${window.location.origin}/credits?purchased=true`,
    cancelUrl: `${window.location.origin}/credits`,
  });
  window.location.href = data.checkoutUrl;
};
```

---

## Phase 6: Landing Page Performance (Days 32–35)

> _The landing page is the first impression. Sub-1.2s LCP is non-negotiable._

### 6.1 — Code-Split Below-the-Fold Sections

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/page.tsx` | Dynamic import for below-fold sections |

```tsx
// page.tsx
import dynamic from 'next/dynamic';

// Hero stays eager — it's above the fold
import { Hero } from './_landing/Hero';

// Everything else lazy-loads
const CharacterGallery = dynamic(() => import('./_landing/CharacterGallery'), {
  loading: () => <div className="h-screen bg-nocturne" />,
});
const TryHer = dynamic(() => import('./_landing/TryHer'));
const Pricing = dynamic(() => import('./_landing/Pricing'));
const QuietReassurance = dynamic(() => import('./_landing/QuietReassurance'));
const FAQ = dynamic(() => import('./_landing/FAQ'));
const FinalCTA = dynamic(() => import('./_landing/FinalCTA'));
const Footer = dynamic(() => import('./_landing/Footer'));

export default function HomePage() {
  return (
    <main className="bg-nocturne text-whisper">
      <Hero />
      <CharacterGallery />
      <TryHer />
      <Pricing />
      <QuietReassurance />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
```

---

### 6.2 — Three.js Loading Skeleton

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/app/_landing/HeroCanvas.tsx` | Add gradient fallback during load |

```tsx
// HeroCanvas.tsx — replace loading: () => null
const FluidBackground = dynamic(() => import('./FluidBackground'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-nocturne via-plum/40 to-nocturne animate-pulse" />
  ),
});
```

This ensures users see a beautiful gradient immediately, which morphs into the WebGL shader when ready.

---

### 6.3 — Bundle Analyzer Integration

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/package.json` | Add `@next/bundle-analyzer` |
| `apps/web/next.config.js` | Wrap config with analyzer |

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

**Run:** `ANALYZE=true npm run build` to identify remaining bundle hotspots.

---

## Phase 7: Polish & Accessibility (Days 36–40)

> _The difference between good and Awwwards is in the details._

### 7.1 — `prefers-reduced-motion` Everywhere

**Files to change:**

| File | Change |
|------|--------|
| `apps/web/src/lib/motion.ts` | Add `useReducedMotion` wrapper |

```typescript
// motion.ts — add
import { useReducedMotion } from 'framer-motion';

export function useMotionSafe<T>(variants: T): T | {} {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? {} : variants;
}
```

Use `useMotionSafe(fadeUp)` instead of raw `fadeUp` in all components. Users who prefer reduced motion get instant state changes with no animation.

---

### 7.2 — Aria Labels & Keyboard Navigation

**Files to audit and fix:**

| Component | Missing |
|-----------|---------|
| `AttachmentMenu.tsx` | `aria-label` on plus button, `aria-expanded` state |
| `CharacterCard.tsx` | `role="article"`, `aria-label={character.displayName}` |
| `MessageInput.tsx` | `aria-label="Message input"` on textarea |
| `ConversationList.tsx` | `role="listbox"`, `aria-selected` on active conversation |
| `ImageLightbox.tsx` | Focus trap, `aria-modal="true"`, `role="dialog"` |

---

### 7.3 — Error Boundaries

**Files to create:**

| File | Purpose |
|------|---------|
| `apps/web/src/components/common/ErrorBoundary.tsx` | Catch uncaught errors in chat/gallery |

```tsx
'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
    // TODO: Send to Sentry/error tracking
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-gray-400 text-sm">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-sm text-lilac hover:text-lilac/80"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap `ChatWindow`, `GalleryGrid`, `CharacterGrid` in `<ErrorBoundary>`.

---

## Milestone Summary

| Phase | Days | Key Deliverable | Lighthouse Impact |
|-------|------|----------------|-------------------|
| **0: Infrastructure** | 1–3 | Pagination, indexes, security, `next/image` | +15-20 points |
| **1: Design System** | 4–7 | Fluid type, glass classes, motion primitives, GSAP removal | +5 points (bundle) |
| **2: Chat** | 8–14 | True streaming, virtualization, typing states, layout | +10 points (FID) |
| **3: Discover** | 15–21 | Bento grid, card animations, "For You", category counts | UX quality |
| **4: Gallery** | 22–26 | Masonry, morph lightbox, image compression | +10 points (LCP) |
| **5: Profile** | 27–31 | Edit mode, real stats, editorial layout, purchase flow | Revenue unlock |
| **6: Landing** | 32–35 | Code splitting, loading skeletons, bundle analysis | +5-10 points |
| **7: Polish** | 36–40 | Reduced motion, aria labels, error boundaries | Accessibility |

**Estimated totals after all phases:**
- Lighthouse Performance: 65-70 → **95+**
- LCP: ~3-4s → **< 1.2s**
- Bundle (gzipped): ~350KB → **~220KB** (GSAP removed, code-split, tree-shaken)
- Chat FID with 200 msgs: ~400ms → **< 50ms** (virtualized)

---

## Appendix A: File Change Index

Quick reference — every file touched, sorted by phase.

### Phase 0
```
apps/api/src/modules/characters/characters.controller.ts
apps/api/src/modules/characters/characters.service.ts
apps/api/src/modules/media/media.controller.ts
apps/api/src/modules/media/services/image-generation.service.ts
apps/api/src/modules/conversations/conversations.gateway.ts
apps/api/src/main.ts (or app.module.ts)
apps/web/next.config.js
apps/web/src/components/character/CharacterCard.tsx
apps/web/src/components/media/GalleryItem.tsx
apps/web/src/components/chat/InlineImage.tsx
apps/web/src/components/character/CharacterHero.tsx
packages/database/prisma/schema.prisma
```

### Phase 1
```
apps/web/src/app/globals.css
apps/web/tailwind.config.ts
apps/web/src/lib/motion.ts                          [NEW]
apps/web/src/lib/gsap.ts                             [DELETE]
apps/web/src/components/credits/CreditBadge.tsx
apps/web/package.json
```

### Phase 2
```
apps/api/src/integrations/groq/groq.service.ts
apps/api/src/modules/chat/services/model-router.service.ts
apps/api/src/modules/chat/chat.service.ts
apps/web/src/components/chat/MessageList.tsx
apps/web/src/components/chat/TypingIndicator.tsx
apps/web/src/components/chat/ChatWindow.tsx
apps/web/src/components/chat/ConversationList.tsx
apps/web/src/app/(app)/chat/page.tsx
```

### Phase 3
```
apps/api/src/modules/characters/characters.controller.ts
apps/api/src/modules/characters/characters.service.ts
apps/web/src/components/character/CharacterGrid.tsx
apps/web/src/components/character/CharacterCard.tsx
apps/web/src/components/character/CategoryChips.tsx
apps/web/src/app/(app)/discover/page.tsx
```

### Phase 4
```
apps/api/src/common/services/storage.service.ts
apps/api/src/modules/media/services/image-generation.service.ts
apps/web/src/components/media/GalleryGrid.tsx
apps/web/src/components/media/GalleryItem.tsx
apps/web/src/components/media/ImageLightbox.tsx
apps/web/src/app/(app)/gallery/page.tsx
```

### Phase 5
```
apps/api/src/modules/users/users.controller.ts
apps/api/src/modules/users/users.service.ts
apps/web/src/app/(app)/profile/page.tsx
apps/web/src/components/credits/PackageCard.tsx
apps/web/src/app/(app)/credits/page.tsx
```

### Phase 6
```
apps/web/src/app/page.tsx
apps/web/src/app/_landing/HeroCanvas.tsx
apps/web/next.config.js
apps/web/package.json
```

### Phase 7
```
apps/web/src/lib/motion.ts
apps/web/src/components/chat/AttachmentMenu.tsx
apps/web/src/components/character/CharacterCard.tsx
apps/web/src/components/chat/MessageInput.tsx
apps/web/src/components/chat/ConversationList.tsx
apps/web/src/components/media/ImageLightbox.tsx
apps/web/src/components/common/ErrorBoundary.tsx    [NEW]
```

---

## Appendix B: New Dependencies

| Package | Phase | Size (gzipped) | Purpose |
|---------|-------|----------------|---------|
| `@tanstack/react-virtual` | 2 | ~5KB | Message list virtualization |
| `sharp` | 4 | ~30KB (native) | Server-side image compression |
| `@next/bundle-analyzer` | 6 | dev only | Bundle analysis |
| `@nestjs/throttler` | 0 | ~8KB | API rate limiting |

**Removed:**

| Package | Phase | Size (gzipped) | Reason |
|---------|-------|----------------|--------|
| `gsap` | 1 | ~60KB | Replaced by Framer Motion |

**Net bundle change:** -55KB gzipped (client-side).

---

## Appendix C: Validation Checklist

Run after each phase before proceeding to the next.

### Performance
- [ ] `ANALYZE=true npm run build` — no single chunk > 150KB
- [ ] Lighthouse Performance score ≥ 90 on `/discover`
- [ ] LCP < 1.5s on Fast 3G throttle (Chrome DevTools)
- [ ] No layout shift (CLS < 0.05)

### Functionality
- [ ] All `useInfiniteQuery` endpoints paginate correctly (no duplicates)
- [ ] Chat streaming shows first token within 300ms
- [ ] Gallery lightbox morph animation plays smoothly
- [ ] Profile stats show real numbers (not "—")
- [ ] Credit purchase flow completes through Stripe

### Visual
- [ ] Glass effects render correctly on Chrome, Safari, Firefox
- [ ] Fluid typography scales smoothly from 375px to 2560px viewport
- [ ] Dark theme has no white flashes on navigation
- [ ] `prefers-reduced-motion` disables all animations

### Accessibility
- [ ] All interactive elements reachable via Tab key
- [ ] Screen reader announces page transitions
- [ ] Color contrast ratio ≥ 4.5:1 for body text
- [ ] Image lightbox traps focus correctly
