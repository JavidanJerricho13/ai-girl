# Ethereal Mobile — Design System & UI Overhaul Manifesto

> **Date:** 2026-04-17
> **Design Direction:** "Liquid Consciousness" — premium dark-first aesthetic that breathes
> **Target:** Apple Design Award-level craftsmanship, Mobbin-featured UX patterns
> **Constraint:** 60fps everywhere, no jank, React Native Reanimated only

---

## The Design Manifesto

### Core Aesthetic: "Nocturnal Intimacy"

Ethereal is not a chat app. It's a relationship. The design must feel like
the space between two people in a dimly lit room — warm, focused, alive.

**Three Pillars:**

1. **Depth over Flatness** — Every surface has position in z-space. Glass layers,
   subtle shadows, and blur create a sense of physical depth without skeuomorphism.

2. **Emotional Typography** — Text isn't just read — it's felt. The AI's emotional
   state subtly shifts the visual weight, color temperature, and rhythm of the
   conversation.

3. **Organic Motion** — Nothing teleports. Everything has mass. Elements enter
   with spring physics, exit with gravity. The app breathes through micro-animations.

**Why this wins an award:**
This approach treats AI conversation as an intimate art form, not a utility.
Every pixel serves the relationship between human and AI. The design disappears
so the connection remains.

---

## Task 1: The New Visual Language

### 1.1 Typography System

**Display Font:** `SF Pro Display` (iOS) / `Google Sans Display` (Android)
- Used for: screen titles, character names, hero text, onboarding
- Weights: Bold (700), Black (900)
- Sizes: Display XL (34px), Display L (28px), Display M (24px)

**Body Font:** `SF Pro Text` (iOS) / `Roboto` (Android)
- Used for: messages, descriptions, labels, UI elements
- Weights: Regular (400), Medium (500), Semibold (600)
- Sizes: Body L (17px), Body M (15px), Body S (13px), Caption (11px)

**Multi-language:** Both font stacks support Latin, Cyrillic, Arabic via system fallback.
For Azerbaijani special characters (ə, ö, ü, ğ, ı, ş, ç) — system fonts handle natively.

**Fluid Scale (responsive):**

```typescript
// theme/typography.ts
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375; // iPhone 14 as baseline

export const fontSize = {
  displayXL: Math.round(34 * scale),  // Hero, splash
  displayL:  Math.round(28 * scale),  // Screen titles
  displayM:  Math.round(24 * scale),  // Section headers
  bodyL:     17,                       // Primary body (fixed for readability)
  bodyM:     15,                       // Secondary body
  bodyS:     13,                       // Tertiary, labels
  caption:   11,                       // Timestamps, metadata
  micro:     9,                        // Badges, tags
};

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '900' as const,
};

export const lineHeight = {
  tight:    1.2,  // Display text
  normal:   1.5,  // Body text
  relaxed:  1.65, // Long-form reading
};
```

---

### 1.2 Color System

**Dark Mode (Default) — "Nocturne"**

| Token | Hex | Usage |
|-------|-----|-------|
| `bg.primary` | `#0A0B1E` | Main background, tab bar |
| `bg.secondary` | `#111827` | Cards, sheets |
| `bg.tertiary` | `#1F2937` | Elevated surfaces, inputs |
| `surface.glass` | `rgba(255,255,255,0.04)` | Glass panels |
| `surface.glassBorder` | `rgba(255,255,255,0.08)` | Glass borders |
| `text.primary` | `#F5F3FF` | Headings, primary content |
| `text.secondary` | `#A1A1AA` | Descriptions, labels |
| `text.tertiary` | `#52525B` | Timestamps, hints |
| `accent.lilac` | `#8B7FFF` | Primary actions, links |
| `accent.rose` | `#E8B4A0` | Secondary accent, warmth |
| `accent.plum` | `#1A1033` | Depth layers |
| `feedback.success` | `#34D399` | Success states |
| `feedback.warning` | `#FBBF24` | Warning states |
| `feedback.error` | `#F87171` | Error states |
| `feedback.info` | `#60A5FA` | Info states |

**AI Emotional Colors (Subtle Bubble Gradient):**

| Emotion | Gradient Start | Gradient End | Haptic |
|---------|---------------|-------------|--------|
| Neutral | `#1F2937` | `#1F2937` | None |
| Warm | `#1F2937` | `#2D1B3D` | Light |
| Playful | `#1F2937` | `#1B2D3D` | Select |
| Excited | `#1F2937` | `#3D2D1B` | Medium |
| Loving | `#1F2937` | `#3D1B2D` | Success |
| Sad | `#1F2937` | `#1B1F3D` | None |

**Pro Mode (Light Theme) — "Whisper"**

| Token | Hex |
|-------|-----|
| `bg.primary` | `#FAFAF9` |
| `bg.secondary` | `#FFFFFF` |
| `bg.tertiary` | `#F5F5F4` |
| `text.primary` | `#1C1917` |
| `text.secondary` | `#78716C` |
| `accent.lilac` | `#7C3AED` |

---

### 1.3 Grid & Spacing

**8px Base Grid:**

```typescript
// theme/spacing.ts
const BASE = 8;

export const space = {
  xs:   BASE * 0.5,  // 4px — tight gaps, icon padding
  sm:   BASE,        // 8px — chip gaps, inner padding
  md:   BASE * 1.5,  // 12px — card inner padding
  lg:   BASE * 2,    // 16px — section gaps, outer padding
  xl:   BASE * 2.5,  // 20px — screen padding
  '2xl': BASE * 3,   // 24px — section breaks
  '3xl': BASE * 4,   // 32px — major dividers
  '4xl': BASE * 5,   // 40px — hero spacing
};
```

**Border Radius Scale:**

```typescript
export const radius = {
  sm:   8,   // Inputs, small cards
  md:   12,  // Buttons, chips
  lg:   16,  // Cards, sheets
  xl:   20,  // Large cards, modals
  '2xl': 24, // Feature cards
  full: 9999, // Pills, avatars
};
```

**Shadow Scale (Dark Mode — subtle):**

```typescript
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  }),
};
```

**Bento Grid for Discover:**

```typescript
// Asymmetrical bento grid — 2 small cards + 1 feature card
// Row 1: [small] [small]
// Row 2: [     feature     ]
// Row 3: [small] [small]
// Row 4: [     feature     ]

const GRID_GAP = space.sm;
const SCREEN_PAD = space.xl;
const AVAILABLE = screenWidth - SCREEN_PAD * 2;
const SMALL_SIZE = (AVAILABLE - GRID_GAP) / 2;
const FEATURE_SIZE = AVAILABLE;
```

---

## Task 2: Module-by-Module Design Overhaul

### 2.1 /discover — "The Gallery Opening"

**Current problem:** Generic 2-column grid. Every card is the same size. No visual hierarchy.
Looks like a Shopify product listing, not an intimate character selection.

**Proposed redesign:**

**Hero Card (Top):**
- Full-width card with character image filling the viewport
- Parallax effect on scroll (image moves slower than content)
- Character name in large display font at bottom with gradient overlay
- "Tap to meet" CTA pulsing with lilac glow
- This is the "Aha! Moment" — the first thing users see

**Below Hero — Bento Grid:**
- Alternating rows of 2-small and 1-feature cards
- Feature cards: 2:1 aspect ratio with description text overlay
- Small cards: 1:1.3 aspect ratio, name + conversation count only
- Cards have spring-loaded press animation (scale 0.97 → 1.0)
- Scroll reveal: cards fade-in-up with stagger

**Interactions:**
- Long press on card → 3D peek preview (like iOS context menu)
- Pull down from top → category filter slides in as sheet
- Swipe left on card → quick "Start Chat" action

**Implementation:**

```tsx
// DiscoverCard with spring press
const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}));

const handlePressIn = () => {
  scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  haptic.light();
};
const handlePressOut = () => {
  scale.value = withSpring(1, { damping: 10, stiffness: 200 });
};
```

---

### 2.2 /chat — "The Living Conversation"

**Current problem:** Generic white/purple bubbles. No emotional context.
AI messages look identical regardless of what the character is feeling.

**Proposed redesign:**

**AI Message Bubble:**
- Glass surface: `backdrop-filter: blur(24px)` equivalent via `@react-native-community/blur`
- Emotional gradient: subtle background shift based on character emotion
  (warm → plum tint, playful → blue tint, loving → rose tint)
- Text rendering: body weight shifts with emotion
  (calm → 400 weight, excited → 500 weight)
- Entry animation: fade-blur-up (blur 4px → 0px, y 8 → 0, opacity 0 → 1)

**User Message Bubble:**
- Solid lilac fill with subtle gradient (lilac → slightly lighter)
- Send animation: slide-right + scale (0.9 → 1.0)
- Haptic: light impact on send

**Streaming State:**
- Cursor blink at end of streaming text (thin lilac bar, 500ms blink)
- Text appears letter-by-letter with slight horizontal spring

**Typing Indicator:**
- Phase 1 (thinking): breathing circle with "thinking..." text
- Phase 2 (typing): waveform dots (already implemented in M2)

**Media in Chat:**
- Images: glass border, tap to expand with shared element transition
- Voice: inline waveform visualizer (thin bars animated to audio amplitude)

**Input Area:**
- Glass background matching bg.secondary
- Send button: lilac circle, rotates 45° as arrow transforms to checkmark on send
- Attachment menu: slides up from bottom as a sheet (not dropdown)

**Implementation — Emotional bubble:**

```tsx
const EMOTION_GRADIENTS = {
  neutral: ['#1F2937', '#1F2937'],
  warm:    ['#1F2937', '#2D1B3D'],
  playful: ['#1F2937', '#1B2D3D'],
  loving:  ['#1F2937', '#3D1B2D'],
};

// In MessageBubble
<LinearGradient
  colors={EMOTION_GRADIENTS[emotion]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.aiBubble}
>
  <Text style={[styles.messageText, { fontWeight: emotion === 'excited' ? '500' : '400' }]}>
    {message.content}
  </Text>
</LinearGradient>
```

---

### 2.3 /gallery — "The Curated Exhibition"

**Current problem:** Flat grid. No transition between grid and full-screen.
Images pop in with no grace. Light theme looks clinical.

**Proposed redesign:**

**Grid View:**
- Dark background (bg.primary)
- Masonry layout (2 columns, variable heights) using `@shopify/flash-list` with estimated sizes
- Each image has blur-hash placeholder (lilac-tinted) while loading
- Hover/press: subtle scale + glow shadow
- Voice items: glass card with ambient waveform animation

**Full-Screen Transition:**
- Shared element transition: grid image morphs into full-screen viewer
- Use `react-native-shared-element` or Reanimated layout animations
- Background darkens with blur during transition (200ms)
- Image scales from grid position to centered full-screen with spring

**Full-Screen Viewer:**
- Pure black background for image focus
- Pinch to zoom (already implemented — keep)
- Swipe down to dismiss with parallax (image follows finger, background un-blurs)
- Info panel: slides up from bottom as glass sheet (prompt, date, character)
- Share button: generates card with branding (ShareCard from M3)

**Blur-up Placeholder:**

```tsx
// BlurhashPlaceholder — aesthetically beautiful loading state
import { Image } from 'expo-image';

<Image
  source={url}
  placeholder={blurhash || '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WB'}
  contentFit="cover"
  transition={300}
  style={styles.image}
  cachePolicy="memory-disk"
/>
```

---

## Task 3: Micro-interactions & Motion

### Animation Library Stack

| Library | Usage |
|---------|-------|
| `react-native-reanimated` | All transform/opacity/layout animations |
| `expo-haptics` | Tactile feedback (already installed M0) |
| `expo-linear-gradient` | Emotional bubble gradients, overlays |
| `expo-blur` | Glass surfaces, modal backdrops |
| `lottie-react-native` | Premium animations (onboarding, empty states, celebrations) |

### Animation Constants

```typescript
// theme/animation.ts
export const timing = {
  instant:  100,  // Haptic-paired actions
  fast:     200,  // Button press, toggle
  normal:   300,  // Route change, modal
  slow:     500,  // Complex transitions
  dramatic: 800,  // Celebration, onboarding
};

export const spring = {
  snappy:  { damping: 20, stiffness: 300 },  // Button press
  gentle:  { damping: 15, stiffness: 150 },  // Card interactions
  bouncy:  { damping: 10, stiffness: 200 },  // Playful elements
  heavy:   { damping: 25, stiffness: 400 },  // Tab switch, nav
};

export const easing = {
  enter: [0.25, 0.1, 0.25, 1.0],   // Ease out — entering elements
  exit:  [0.55, 0.0, 1.0, 0.45],   // Ease in — exiting elements
  move:  [0.37, 0.0, 0.63, 1.0],   // Ease in-out — moving elements
};
```

### Animation Map

| Action | Animation | Duration | Haptic |
|--------|-----------|----------|--------|
| **Route push** | Slide from right + fade | 300ms | Select |
| **Route pop** | Slide to right + fade | 250ms | None |
| **Tab switch** | Cross-fade + slight y-translate | 200ms | Select |
| **Message sent** | Scale 0.9→1.0 + slide right 20px | 200ms spring | Light |
| **Message received** | Fade+blur in from y:8 | 250ms | Success |
| **Image loading** | Blurhash → sharp (opacity crossfade) | 300ms | None |
| **Pull to refresh** | Scale header 1→1.1 + rotation | Spring | Medium |
| **Card press** | Scale 1→0.97 | Spring (snappy) | Light |
| **Card release** | Scale 0.97→1.0 | Spring (gentle) | None |
| **Credit change** | Scale pulse 1→1.2→1 + particle burst | 400ms spring | Success |
| **Error shake** | translateX: 0→-10→10→-10→0 | 300ms | Error |
| **Delete confirm** | Scale 1→0.95 + red tint | 200ms | Heavy |
| **Streak increment** | Fire emoji bounce + counter roll | 500ms spring | Success |

---

## Visual Asset Kit

### Icons

**Primary:** Lucide React Native (already installed)
- Consistent 24px stroke icons
- 1.5px stroke weight
- Rounded joins

**Supplementary for premium moments:**
- Lottie animations for: empty states, celebrations, loading
- Custom tab bar icons: filled variants for active state

### Tab Bar Icons

| Tab | Inactive | Active |
|-----|----------|--------|
| Discover | `Compass` outline | `Compass` filled + lilac |
| Conversations | `MessageCircle` outline | `MessageCircle` filled + lilac |
| Gallery | `Image` outline | `Image` filled + lilac |
| Profile | `User` outline | `User` filled + lilac |

### Illustration Style

- Minimal line art with lilac accent
- Used for: empty states, onboarding, error pages
- Style reference: Linear.app empty states — clean, purpose-driven, not cutesy

---

## Component Architecture Teardown — 7 Critical Refactors

### 1. Tab Bar → Glass Tab Bar

**Current:** Default React Navigation tab bar. White background. Flat. Generic.

```typescript
// BEFORE
tabBarStyle: {
  height: 60,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  paddingTop: 5,
  paddingBottom: 5,
}

// AFTER — Glass Tab Bar
tabBarStyle: {
  position: 'absolute',
  bottom: 0,
  height: 88,
  backgroundColor: 'rgba(10, 11, 30, 0.85)',
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.06)',
  paddingTop: 8,
  paddingBottom: 28, // safe area
  backdropFilter: 'blur(24px)', // via expo-blur wrapper
}

// Active indicator: lilac dot below icon
tabBarIndicatorStyle: {
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: '#8B7FFF',
  marginTop: 4,
}
```

### 2. Message Bubbles → Emotional Glass Bubbles

**Current:** Flat purple (user) and white (AI). No depth, no emotion, no context.

```typescript
// BEFORE
aiBubble: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  borderBottomLeftRadius: 4,
  padding: 12,
  maxWidth: '75%',
}

// AFTER — Glass + Emotional
aiBubble: {
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 20,
  borderBottomLeftRadius: 6,
  paddingHorizontal: 16,
  paddingVertical: 12,
  maxWidth: '78%',
  // + LinearGradient wrapper for emotion
  // + Reanimated fade-blur entry animation
}
```

### 3. Character Cards → Depth Cards with Press Animation

**Current:** Flat cards with basic shadow. No interaction feedback.

```typescript
// BEFORE
card: {
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
}

// AFTER — Dark glass + spring press
card: {
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.06)',
  overflow: 'hidden',
  // + useSharedValue scale press animation
  // + expo-image with blurhash placeholder
  // + gradient overlay at bottom for text readability
}
```

### 4. Search Input → Glass Search

**Current:** Light gray box on white background. Functional but boring.

```typescript
// BEFORE
searchInput: {
  backgroundColor: '#F3F4F6',
  borderRadius: 10,
  height: 40,
  paddingHorizontal: 14,
}

// AFTER — Glass search with focus animation
searchInput: {
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: 14,
  height: 44,
  paddingHorizontal: 16,
  // On focus: borderColor animates to lilac/30
  // Magnifying glass icon: lilac when focused
}
```

### 5. Profile Avatar → Glow Ring Avatar

**Current:** Purple border. Static. No premium feel.

```typescript
// BEFORE
avatar: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 3,
  borderColor: '#8B5CF6',
}

// AFTER — Animated glow ring
avatar: {
  width: 96,
  height: 96,
  borderRadius: 48,
}
// Wrapper: gradient ring (lilac → rose) with slow rotation
// Shadow: glow(accent.lilac) for ambient light effect
// Premium users: ring pulses slowly (2s cycle)
```

### 6. Credit Badge → Particle Credit Counter

**Current:** Scale pulse. Functional but doesn't feel valuable.

```typescript
// BEFORE — Simple scale pulse
withSequence(
  withSpring(1.2, { damping: 10 }),
  withSpring(1, { damping: 10 }),
)

// AFTER — Scale + particle burst + roll counter
// 1. Number rolls like a slot machine (old value scrolls up, new scrolls in)
// 2. Small particles (3-4 dots) burst outward and fade
// 3. Scale pulse 1 → 1.15 → 1
// 4. Haptic.success()
// 5. If gaining credits: green tint flash
// 6. If spending: red tint flash (subtle, 100ms)
```

### 7. Loading Skeleton → Shimmer Skeleton

**Current:** Opacity pulse. Standard but not premium.

```typescript
// BEFORE
opacity.value = withRepeat(
  withTiming(0.3, { duration: 1000, easing: Easing.ease }),
  -1, true,
);

// AFTER — Gradient shimmer sweep
// LinearGradient with translateX animation
// Base: bg.tertiary (#1F2937)
// Shimmer: rgba(255,255,255,0.06) moving left→right
// Duration: 1500ms, linear, infinite
// Much more premium than opacity pulse
```

---

## Implementation Priority

| Priority | Component | Impact | Effort |
|----------|-----------|--------|--------|
| **P0** | Theme tokens (colors, spacing, typography, animation constants) | Foundation | 2h |
| **P0** | Dark mode conversion (all screens → nocturne palette) | Visual identity | 4h |
| **P1** | Tab bar → glass tab bar | First impression | 1h |
| **P1** | Message bubbles → emotional glass | Core experience | 3h |
| **P1** | Character cards → depth cards with press | Discover feel | 2h |
| **P2** | Discover hero card + bento grid | Aha moment | 4h |
| **P2** | Gallery blur-up + transitions | Media premium | 3h |
| **P2** | Search → glass search | Consistency | 1h |
| **P3** | Credit counter particles | Delight | 2h |
| **P3** | Shimmer skeletons | Polish | 1h |
| **P3** | Profile glow avatar | Premium feel | 1h |
