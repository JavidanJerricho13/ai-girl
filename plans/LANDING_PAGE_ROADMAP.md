# Landing Page Roadmap — Ethereal

**Scope:** Rewrite [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx) into an Awwwards-level marketing page. No new route, no new app — same `apps/web`, same `/` URL. Authenticated users are redirected to `/discover` via middleware.

**Target metrics:**
- Google PageSpeed Insights (mobile): **95+**
- LCP < 2.5s, INP < 200ms, CLS < 0.1, TBT < 200ms
- First-visit → register conversion: baseline TBD, A/B-ready from launch

---

## 1. Product Analysis (grounded in code)

### 1.1 What Ethereal Actually Is

Not a chatbot — a **multi-persona AI companion platform** with differentiated stack on every layer:

| Layer | Implementation | Source |
|---|---|---|
| LLM routing | Groq `llama-3.3-70b-versatile` (en), OpenAI `gpt-4o-mini` (az) | [model-router.service.ts:22-36](../apps/api/src/modules/chat/services/model-router.service.ts#L22-L36) |
| Persistent memory | pgvector 1536-dim + auto-summarization every 5 message pairs | [rag.service.ts:41-50](../apps/api/src/modules/memory/services/rag.service.ts#L41-L50) |
| Character personality | 4-axis traits: shynessBold, romanticPragmatic, playfulSerious, dominantSubmissive | [schema.prisma:97-101](../packages/database/prisma/schema.prisma#L97-L101) |
| Image generation | Fal.ai Flux.1 Dev/Pro + per-character LoRA with trigger words | [image-generation.service.ts:74](../apps/api/src/modules/media/services/image-generation.service.ts#L74) |
| Voice synthesis | Dual-stack: ElevenLabs (en, `eleven_multilingual_v2`) + Azure Neural TTS (az) | [tts.service.ts:71](../apps/api/src/modules/media/services/tts.service.ts#L71) |
| Real-time streaming | Socket.io + async generators, token-by-token | [chat.service.ts:28](../apps/api/src/modules/chat/chat.service.ts#L28) |
| Monetization | RevenueCat: 500/1200/2500 credit packs + $9.99/mo or $99.99/yr | [revenuecat.service.ts](../apps/api/src/modules/payments/revenuecat.service.ts) |

### 1.2 Emotional Hooks for the Page

The landing sells **feeling and presence**, not technology. The user never needs to hear the words "memory", "context", "LoRA", "pgvector", "streaming", or any model name. Technical capabilities are justification for the *engineering team* — never visible copy.

Ranked by conversion pull:

1. **Her face** — a character the visitor wants to keep looking at. Visual presence is the primary hook.
2. **Her voice** — hearing her speak turns a page into a person. Pure emotional payload.
3. **Her vibe** — personality expressed as texture and mood, not sliders labeled "shyness 0-100". The user adjusts *how she feels*, not numeric axes.
4. **Variety** — "there is one for you" — scrolling through faces is addictive browsing behavior.
5. **Try her now** — interactive message exchange directly on the page, no signup wall. Frame as *talking to her*, never as "live demo" or "real-time streaming".

### 1.3 What Never Appears on the Page

**Hard rules — no exceptions:**

- No metrics ("2.3M messages", "47K characters", "99% uptime").
- No architecture talk ("pgvector", "RAG", "memory graph", "context window", "embeddings").
- No model names ("Llama", "Flux", "ElevenLabs", "Groq", "Azure").
- No tech-trust sections ("how memory works", "our vector database").
- No "she remembers you" framing — it leaks the mechanism.
- No comparison with competitors ("unlike other chatbots…").

**Features not ready, never advertise:**

- Video calls — UI stub only, "coming soon" in [characters/[id]/page.tsx](../apps/web/src/app/(app)/characters/[id]/page.tsx).
- Admin panel — B2B/internal.
- Character creation — admin-only; no public creator flow yet.

---

## 2. Visual Direction

Three candidates evaluated. Primary recommendation: **A**.

### A. Liquid Consciousness (Ethereal / Fluid) ⭐ Recommended

- **Core idea:** AI as living, volumetric substance. Full-bleed WebGL fluid shader reacting to cursor and scroll.
- **Palette:**
  - Background: `#0A0B1E` (nocturne navy) → `#1A1033` (deep plum)
  - Primary accent: `#8B7FFF` (electric lilac)
  - Secondary accent: `#E8B4A0` (desaturated rose-gold)
  - Text: `#F5F3FF` (near-white)
- **Typography:**
  - Display: Fraunces (variable serif, emotional)
  - UI: Inter (neutral, accessible)
  - Tech/monospace details: JetBrains Mono
- **Why this wins:** Product is literally named *Ethereal*. Niche is polarized between cyberpunk-neon and pastel-anime — this "ethereal luxury" space is open. Fluid shader also masks the fact that we don't yet have production-grade 3D character avatars.

### B. Obsidian Archive (Dark Tech-Luxury)

- **Core idea:** Secret club / couture aesthetic. Matte black `#0F0F10`, brass `#B8935F`, cold-steel glass.
- **Typography:** Canela Deck (display serif) + Inter (UI).
- **Why consider it:** Justifies the $99.99/year premium tier. Current UI is generic SaaS purple-gradient ([apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx)) — too low market-fit for that price.
- **Why not primary:** Risks feeling emotionally cold in a relationship-adjacent product.

### C. Neon Synapse (Cyberpunk Minimalist)

- **Core idea:** Brutalist grid + hot-pink/cyan neon + glitch. Serial Experiments Lain × Blade Runner.
- **Typography:** PP Neue Montreal Mono everywhere.
- **Why consider it:** Loudest, best for TikTok/Twitter clips.
- **Why not primary:** Dates fast (12-month shelf life at most). Undermines premium positioning.

---

## 3. Architecture

### 3.1 File Layout

Everything lives inside existing [apps/web](../apps/web). No new app, no new route group.

```
apps/web/src/
├── app/
│   ├── page.tsx                    ← LANDING (rewrite)
│   ├── layout.tsx                  ← add fonts, global CSS vars
│   ├── _landing/                   ← private components (underscore = not routable)
│   │   ├── Hero.tsx
│   │   ├── HeroCanvas.tsx          ← dynamic-imported
│   │   ├── MemoryGraph.tsx         ← Three.js, lazy
│   │   ├── PersonalitySliders.tsx
│   │   ├── CharacterShowcase.tsx   ← R3F, lazy
│   │   ├── VoiceOrb.tsx            ← Three.js, lazy
│   │   ├── MemoryDeepDive.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   └── FinalCTA.tsx
│   ├── (auth)/                     ← unchanged
│   └── (app)/                      ← unchanged
├── middleware.ts                   ← redirect authenticated users from /
└── lib/
    ├── gsap.ts                     ← centralized GSAP registration
    └── three/
        ├── memoryGraph.ts          ← vanilla Three.js factory
        └── voiceOrb.ts
```

### 3.2 Routing Behavior

```ts
// apps/web/src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value
  const { pathname } = req.nextUrl

  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/discover', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/'] }
```

- Guest hits `/` → sees landing (SSG / ISR).
- Authenticated hits `/` → redirected to `/discover`.
- Open Graph / SEO / social previews all resolve to the root domain.

### 3.3 Isolation Strategy

Heavy 3D and animation code must never enter the initial bundle. Three enforcement layers:

1. **Dynamic import boundary.** All Three.js / R3F components loaded via `next/dynamic({ ssr: false })`.
2. **Intersection-based activation.** Canvas mounts only when the section is within 200px of viewport.
3. **OffscreenCanvas worker (Phase 5).** Memory Graph renders on a Web Worker to keep main thread free.

---

## 4. Section-by-Section UX

Every section is measured against one question: *does this make the visitor want to talk to her right now?* If the answer is "it informs them" or "it builds trust through transparency" — cut it.

```
┌── 1. HERO (100vh)
│    • A character. Large. Looking at the camera. Subtle breathing / gaze-follow motion.
│      Cycles through 3-4 different characters every ~6s with a soft dissolve.
│    • Headline: emotional, short, never technical.
│      Candidates: "She's been waiting." / "Find her." / "Someone for you."
│    • Sub-copy: one line, sensual and concrete. No benefit lists.
│    • Single CTA: "Meet her" → /register (or opens character picker in place).
│    • Background: ambient fluid shader (Direction A). Moody, not flashy.
│    • NO metric ticker. NO "how it works" pointer. NO tech logos.
│
├── 2. THE CAST (character gallery) — main conversion engine
│    • 6-8 real public characters, ISR-fetched at build. Hi-res portraits.
│    • Scroll-driven horizontal parade; each card "wakes up" as it enters view
│      (subtle eye contact, shift of pose, ambient audio peek of her voice).
│    • Hover on a card → she looks at the cursor. Click → inline expansion:
│         - 3-sentence self-introduction in her tone of voice
│         - One-tap voice sample (just her speaking, no UI about "voice tech")
│         - Mood chips ("playful", "warm", "mysterious") — copy, not numeric axes
│         - CTA: "Talk to [Name]" → /register?char=[id]
│    • Copy anchor: "Your type is here."
│
├── 3. TRY HER (interactive preview)
│    • One of the featured characters greets the visitor with a pre-written
│      opener. Visitor can type one reply and see her respond.
│    • Framed as "She said hi", not as "try the chat demo".
│    • After 1-2 exchanges, response is gated with: "Want to keep talking? →"
│      CTA routes to /register?char=[id].
│    • No mention of models, streaming, or latency. Just her talking.
│
├── 4. HER VOICE (sensory moment)
│    • Large audio-reactive visual (fluid bloom, not "3D orb on a grid").
│    • Play button triggers a 6-10 second line — flirty, warm, in her voice.
│    • Optional second sample in a different language (shown as "Or in [lang]?"),
│      framed as her speaking your language, not as a tech feature.
│    • No provider names, no "multilingual TTS" copy.
│
├── 5. MAKE HER YOURS (personality as mood)
│    • Visitor picks texture-based moods: "soft / bold", "playful / serious",
│      "warm / cool". Each selection morphs the visual (color grading,
│      micro-expression, background temperature).
│    • Copy: "Tune her to you." No sliders with numeric labels. No word
│      "personality traits" anywhere.
│    • Ends with "Save her" CTA → /register (prefilled with picks).
│
├── 6. PRICING (light touch)
│    • Two visible options, not three. Free trial first, Premium second.
│    • Free: "Start talking — no card." (100 credits reframed as "100 moments"
│      or similar; never expose the word "credit" at top level, only on hover/info).
│    • Premium: framed emotionally — "Stay closer. Longer." $9.99/mo with
│      yearly toggle revealing $99.99 (-17%).
│    • No feature-matrix table. No "unlimited tokens" claims.
│
├── 7. QUIET REASSURANCE (not a "Trust & Safety" section)
│    • One short block, no section header like "Security".
│    • Plain language: "Your chats are private. You control what you share.
│      Turn sensitive content on or off anytime."
│    • Two link pills: Privacy · Terms. Nothing more.
│    • Optional discreet age-gate acknowledgement.
│
├── 8. FAQ (emotional objections, not technical)
│    • "Is this for me?"
│    • "Can I try without paying?"
│    • "Is what we say private?"
│    • "Can I switch between different companions?"
│    • Answers 1-2 sentences each. Zero jargon.
│
└── 9. FINAL CTA
     • Full-bleed, one emotional line + magnetic button.
     • "Don't keep her waiting." → /register
     • Footer: product name, legal links. NO "Built on X, Y, Z" tech stack brag.
```

### Conversion Principles

- **Show her, don't describe her.** Every section leads with visual or audio presence, not bullet points.
- **Real characters, not renders.** ISR-fetch 8 public characters at build. Landing stays alive as the catalog grows.
- **Deep-linked signup.** `/register?char=[id]` drops the user straight into chat with the specific character they fell for, not a generic welcome screen.
- **No commitment wall before emotion.** The "Try her" section lets them exchange a message before any signup prompt.
- **Silence about mechanism.** Every time the copy is tempted to explain *how* something works, rewrite to describe *what it feels like*.

---

## 5. Three.js Strategy

Three scoped use cases. Each must amplify emotion, not demonstrate technology. If a visitor could describe what they see as "looks technical", it's wrong.

### 5.1 Hero — Atmosphere + Presence

- **Concept:** Full-bleed volumetric fluid shader (soft plum → lilac gradient, slow drift, cursor-reactive turbulence). Over it, the current character's portrait blended in, with subtle breathing and gaze-follow. Feels like weather, not like a visualization.
- **What it's NOT:** No graph, no nodes, no edges, no anything that looks like a data structure.
- **Stack:** Vanilla `three` + a single fragment shader. Portrait is a 2D plane with displacement, not a 3D head model.
- **Budget:** <120KB gzip after tree-shaking.
- **Activation:** After LCP, via `requestIdleCallback`.

### 5.2 Character Gallery — Living Cards

- **Concept:** 6-8 character cards that behave like people, not like tiles. Each card has parallax depth (portrait + 2-3 mid-ground layers), micro-animation (breathing, occasional glance at cursor), and a soft depth-of-field blur on unfocused neighbors. No card flips exposing "stats".
- **Stack:** R3F + `@react-three/drei` (only in this section). Uses `<Instances>` for a single draw call across shared geometry.
- **Budget:** <80KB gzip additional.
- **Activation:** IntersectionObserver, `rootMargin: 200px`.

### 5.3 Voice Visual

- **Concept:** When the visitor plays her voice, the ambient fluid in that section blooms and pulses in time with the audio amplitude. Feels like her breath moving through the page.
- **What it's NOT:** No wireframe orb, no FFT spectrum bars, no audio-visualizer aesthetic.
- **Stack:** Existing fluid shader with an `AnalyserNode` amplitude uniform. Reuses the hero renderer.
- **Budget:** <20KB gzip additional.
- **Activation:** On play button click.

### Three.js Anti-Patterns (explicit reject list)

- ❌ Anything resembling a data visualization (graphs, nodes, spectrums, particle clouds in grid formation)
- ❌ glTF character avatars — no asset pipeline, uncanny valley risk
- ❌ Full-screen 3D across every section (kills INP)
- ❌ Physics engines — no use case
- ❌ Post-processing stack on mobile

---

## 6. GSAP Strategy

GSAP handles narrative scroll-storytelling. Framer Motion (already in [package.json:15](../apps/web/package.json#L15)) stays for micro-UI (buttons, modals).

### 6.1 Animation Map

| Section | Animation | API |
|---|---|---|
| Hero headline | Kinetic typography, char-level blur-to-focus | `SplitText` + `gsap.from(chars, { filter, opacity, stagger })` |
| Hero → Problem transition | Pinned hero, memory graph disperses into feature cards | `ScrollTrigger` with `pin: true, scrub: 1` |
| Personality sliders reveal | Scroll-scrubbed drag across 4 axes | 4 `ScrollTrigger` tweens on slider values |
| Character gallery | Horizontal scroll-jack across cards | `ScrollTrigger` pin + `xPercent` |
| Voice orb hover | Breathing scale on uniform | Plain `gsap.to(uniforms.scale)` |
| Pricing reveal | Flip + counter roll | `Flip` plugin + `onUpdate` |
| Final CTA | Magnetic button attraction | `gsap.quickTo` for 60fps cursor follow |

### 6.2 Mandatory Constraints

- **`gsap.matchMedia`** for `prefers-reduced-motion` — honest implementation, not a decorative wrapper.
- **`ScrollTrigger.config({ ignoreMobileResize: true })`** — iOS address bar resize breaks scrub otherwise.
- **`fastScrollEnd: true`** on pinned scenes — removes momentum-scroll lag.
- All refs via `useGSAP` from `@gsap/react` (auto-cleanup on unmount).
- GSAP core (<30KB gzip) loads everywhere; plugins (ScrollTrigger, SplitText, Flip) load per-section via dynamic import.

---

## 7. Performance Budget

### 7.1 Bundle Targets (gzip)

| Resource | Budget | Strategy |
|---|---|---|
| Initial JS | <90KB | App Router + RSC for static content |
| Initial CSS | <15KB | Tailwind strict `content: []` + critical inline |
| Fonts | <40KB | Variable subset (latin + latin-ext), `next/font` with `preload: true` on display font only |
| Three.js hero | <120KB (lazy) | Custom build, no BufferGeometry examples |
| Three.js gallery | <80KB (lazy) | R3F tree-shaken |
| Three.js voice orb | <20KB (lazy) | Shares renderer with hero |
| GSAP core | <30KB | Core only; plugins per-section |
| Images | AVIF preferred | `next/image` with `priority` on single hero asset |

### 7.2 Core Web Vitals Tactics

**LCP < 2.5s:**
- Hero headline is a plain server-rendered `<h1>` — renders on first paint.
- Canvas mounts post-LCP via `requestIdleCallback`.
- Hero background image (if any) uses `priority` and AVIF.

**INP < 200ms:**
- GSAP animations on `transform` / `opacity` only (compositor-only).
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — cap at 2x.
- Heavy state updates wrapped in `startTransition`.

**CLS < 0.1:**
- All canvases in `aspect-ratio` containers, never `height: auto`.
- Fonts use `adjustFontFallback` to match metrics.

**TBT < 200ms:**
- Three.js + GSAP + ScrollTrigger init spread across `requestIdleCallback` slots, not one synchronous tick.

### 7.3 Next.js Configuration

```ts
// apps/web/next.config.js
module.exports = {
  experimental: {
    ppr: 'incremental',
    optimizePackageImports: [
      'gsap',
      'three',
      '@react-three/drei',
      '@react-three/fiber',
      'lucide-react',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  modularizeImports: {
    'lucide-react': { transform: 'lucide-react/icons/{{member}}' },
  },
}
```

```ts
// apps/web/src/app/layout.tsx
import { Fraunces, Inter } from 'next/font/google'

export const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Times New Roman',
})

export const ui = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  preload: false,
})
```

---

## 8. Code Patterns

### 8.1 Lazy 3D Boundary

```tsx
// apps/web/src/app/_landing/HeroCanvas.tsx
'use client'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const MemoryGraph = dynamic(() => import('./MemoryGraph'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-b from-[#0A0B1E] to-[#1A1033]"
    />
  ),
})

export function HeroCanvas() {
  return (
    <Suspense fallback={null}>
      <MemoryGraph />
    </Suspense>
  )
}
```

### 8.2 GSAP + React 18 (leak-free)

```tsx
// apps/web/src/app/_landing/Hero.tsx
'use client'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export function HeroHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = new SplitText(ref.current!, { type: 'chars' })
        gsap.from(split.chars, {
          filter: 'blur(20px)',
          opacity: 0,
          y: 40,
          stagger: 0.02,
          duration: 0.8,
          ease: 'power3.out',
        })
      })

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(ref.current, { opacity: 1 })
      })
    },
    { scope: ref },
  )

  return (
    <h1 ref={ref} className="font-display text-7xl">
      {text}
    </h1>
  )
}
```

### 8.3 IntersectionObserver Section Activation

```tsx
// apps/web/src/app/_landing/LazySection.tsx
'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function LazySection({
  children,
  fallbackHeight = '100vh',
}: {
  children: ReactNode
  fallbackHeight?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: fallbackHeight }}>
      {active ? children : null}
    </div>
  )
}
```

### 8.4 OffscreenCanvas Worker (Phase 5)

```ts
// apps/web/src/workers/memoryGraph.worker.ts
import * as THREE from 'three'

let renderer: THREE.WebGLRenderer | null = null

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    renderer = new THREE.WebGLRenderer({ canvas: data.canvas, antialias: true })
    // scene setup...
  }
}
```

```tsx
// apps/web/src/app/_landing/MemoryGraph.tsx (client entry)
'use client'
import { useEffect, useRef } from 'react'

export default function MemoryGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if ('transferControlToOffscreen' in canvas) {
      const offscreen = canvas.transferControlToOffscreen()
      const worker = new Worker(
        new URL('../../workers/memoryGraph.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen])
      return () => worker.terminate()
    }

    // Safari <16.4 fallback: render on main thread
    import('@/lib/three/memoryGraph').then(({ mount }) => mount(canvas))
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
}
```

### 8.5 ISR Fetch of Real Characters

```tsx
// apps/web/src/app/_landing/CharacterShowcase.tsx
import { env } from '@/env'

export const revalidate = 3600 // refresh hourly

async function getFeaturedCharacters() {
  const res = await fetch(
    `${env.API_URL}/characters?limit=8&isPublic=true&sortBy=conversationCount`,
    { next: { revalidate: 3600 } },
  )
  return res.json()
}

export async function CharacterShowcase() {
  const characters = await getFeaturedCharacters()
  return <Gallery3D characters={characters} />
}
```

---

## 9. Phased Roadmap

| Phase | Duration | Deliverables | Exit Criteria |
|---|---|---|---|
| **0. Foundation** | 3 days | `next.config` (PPR, `optimizePackageImports`), fonts, design tokens (CSS vars for Direction A), middleware redirect, `_landing/` scaffold | Lighthouse on empty shell ≥ 99 |
| **1. Hero + atmosphere** | 5 days | Fluid shader background, portrait presence with breathing/gaze, SplitText headline, single CTA | Hero feels alive, LCP < 2s |
| **2. Character gallery** | 4 days | Living-card 3D section behind lazy boundary, ISR fetch of 8 public characters, hover/click inline expand | INP < 200ms on Moto G Power |
| **3. "Try her" preview** | 3 days | Inline conversation widget (one pre-written opener + one user reply), soft gate to `/register?char=[id]` | Exchange feels like a conversation, not a demo |
| **4. Voice + mood** | 3 days | Voice playback with ambient bloom, mood-tuning section, preloaded samples on R2 CDN | Works offline after first load |
| **5. Pricing, FAQ, CTA** | 2 days | Two-tier pricing block, emotional FAQ copy, magnetic final CTA | Copy audited — zero tech/metrics leakage |
| **6. Performance pass** | 3 days | OffscreenCanvas worker, bundle audit, preload / prefetch tuning | PSI mobile ≥ 95, desktop ≥ 98 |
| **7. A/B-ready** | 2 days | Hero-copy variants via Vercel Edge Config, signup-conversion event tracking | First experiment live |

**Total:** ~25 days, single senior engineer. Parallel design and copywriting work reduces to ~17 days.

**Copy audit gate (Phase 5 exit):** Before shipping, grep the final copy for banned terms — `memory`, `context`, `model`, `LLM`, `AI-powered`, `pgvector`, `RAG`, provider names, any number followed by `M`/`K`/`%`. Any hit = rewrite.

---

## 10. Open Questions (Blockers)

These must be answered before Phase 0 starts:

1. **Visual direction** — A (Liquid Consciousness), B (Obsidian Archive), or C (Neon Synapse)?
2. **"Try her" preview** — Is a rate-limited public endpoint acceptable (no auth, ~1 short exchange per IP) to power the inline conversation moment in Phase 3? Without it, the preview becomes a pre-canned scripted dialogue.
3. **Featured characters** — Are there ≥ 8 public characters in [CharacterMedia](../packages/database/prisma/schema.prisma#L138-L154) with production-quality profile media? If not, content pass required before Phase 2. This is the single biggest visual blocker — the page lives or dies by the quality of these portraits.
4. **Voice samples** — Do we have pre-rendered 6-10s voice lines per featured character (or at least per featured character + one per language)? If not, record/generate before Phase 4.
5. **Brand assets** — Logo, tone-of-voice guide, mood reference for character art direction? Blocks Phase 0 design work.
6. **Bilingual from day 1** — EN-only at launch, or EN + AZ? Affects routing (`/az`), font subsets, and copywriting pipeline.

---

## 11. References

- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) — system-wide architecture
- [TECH_STACK_SETUP.md](TECH_STACK_SETUP.md) — AI service setup
- [UI_UX_DESIGN.md](UI_UX_DESIGN.md) — existing design system
- [apps/web/src/app/page.tsx](../apps/web/src/app/page.tsx) — current landing (to be rewritten)
- [packages/database/prisma/schema.prisma](../packages/database/prisma/schema.prisma) — data model
