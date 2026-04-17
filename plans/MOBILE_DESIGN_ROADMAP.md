# Ethereal Mobile — Design System Implementation Roadmap

> **Date:** 2026-04-17
> **Baseline:** Post-audit of all 11 mobile UI components and screens
> **Direction:** "Nocturnal Intimacy" — premium dark-first, glass surfaces, emotional AI
> **Target:** Apple Design Award-level craft, 60fps, zero layout shift
> **Constraint:** React Native Reanimated only, no Animated API, no web-ported patterns

---

## Phase D0: Design Token Foundation (Days 1–2)

> _Build the design system before touching any screens. Every future change references these tokens._

### D0.1 — Create Theme Token Files

**Files to create:**

```
apps/mobile/src/theme/
  ├── colors.ts       — full color palette (dark + light + emotional)
  ├── typography.ts   — font sizes, weights, line heights
  ├── spacing.ts      — 8px grid scale + radius + shadows
  ├── animation.ts    — timing, spring configs, easing curves
  └── index.ts        — re-export all tokens
```

**colors.ts:**

```typescript
export const palette = {
  nocturne:  '#0A0B1E',
  plum:      '#1A1033',
  lilac:     '#8B7FFF',
  rose:      '#E8B4A0',
  whisper:   '#F5F3FF',
};

export const dark = {
  bg: {
    primary:   '#0A0B1E',
    secondary: '#111827',
    tertiary:  '#1F2937',
  },
  surface: {
    glass:       'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassHover:  'rgba(255, 255, 255, 0.06)',
  },
  text: {
    primary:   '#F5F3FF',
    secondary: '#A1A1AA',
    tertiary:  '#52525B',
    inverse:   '#0A0B1E',
  },
  accent: {
    lilac:     '#8B7FFF',
    rose:      '#E8B4A0',
    plum:      '#1A1033',
  },
  feedback: {
    success:   '#34D399',
    warning:   '#FBBF24',
    error:     '#F87171',
    info:      '#60A5FA',
  },
  bubble: {
    user:      '#8B7FFF',
    userText:  '#FFFFFF',
    ai:        'rgba(255, 255, 255, 0.04)',
    aiBorder:  'rgba(255, 255, 255, 0.08)',
    aiText:    '#E4E4E7',
  },
};

export const light = {
  bg: {
    primary:   '#FAFAF9',
    secondary: '#FFFFFF',
    tertiary:  '#F5F5F4',
  },
  text: {
    primary:   '#1C1917',
    secondary: '#78716C',
    tertiary:  '#A8A29E',
  },
  accent: {
    lilac:     '#7C3AED',
    rose:      '#D97706',
  },
};

// AI character emotional gradients (applied to message bubbles)
export const emotion = {
  neutral:  { start: '#1F2937', end: '#1F2937' },
  warm:     { start: '#1F2937', end: '#2D1B3D' },
  playful:  { start: '#1F2937', end: '#1B2D3D' },
  excited:  { start: '#1F2937', end: '#3D2D1B' },
  loving:   { start: '#1F2937', end: '#3D1B2D' },
  sad:      { start: '#1F2937', end: '#1B1F3D' },
};
```

**typography.ts:**

```typescript
import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375;

export const fontSize = {
  displayXL: Math.round(34 * scale),
  displayL:  Math.round(28 * scale),
  displayM:  Math.round(24 * scale),
  bodyL:     17,
  bodyM:     15,
  bodyS:     13,
  caption:   11,
  micro:     9,
};

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '900' as const,
};

export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.65,
};

export const fontFamily = Platform.select({
  ios: {
    display: 'System',
    body:    'System',
  },
  android: {
    display: 'sans-serif',
    body:    'sans-serif',
  },
});
```

**spacing.ts:**

```typescript
const BASE = 8;

export const space = {
  xs:   BASE * 0.5,   // 4
  sm:   BASE,          // 8
  md:   BASE * 1.5,    // 12
  lg:   BASE * 2,      // 16
  xl:   BASE * 2.5,    // 20
  '2xl': BASE * 3,     // 24
  '3xl': BASE * 4,     // 32
  '4xl': BASE * 5,     // 40
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
};

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
  glow: (color: string, intensity = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 20,
    elevation: 0,
  }),
};
```

**animation.ts:**

```typescript
export const timing = {
  instant:   100,
  fast:      200,
  normal:    300,
  slow:      500,
  dramatic:  800,
};

export const spring = {
  snappy:  { damping: 20, stiffness: 300 },
  gentle:  { damping: 15, stiffness: 150 },
  bouncy:  { damping: 10, stiffness: 200 },
  heavy:   { damping: 25, stiffness: 400 },
};

export const easing = {
  enter: [0.25, 0.1, 0.25, 1.0],
  exit:  [0.55, 0.0, 1.0, 0.45],
  move:  [0.37, 0.0, 0.63, 1.0],
};
```

**Validation:**
- [ ] All files export TypeScript types
- [ ] No circular dependencies
- [ ] `import { dark, space, fontSize } from '@/theme'` works from any screen

---

### D0.2 — Install Required Design Dependencies

```bash
cd apps/mobile && npx expo install expo-linear-gradient expo-blur
```

**Why:**
- `expo-linear-gradient`: emotional bubble gradients, card overlays, hero effects
- `expo-blur`: glass tab bar, modal backdrops, glass surfaces

**Validation:**
- [ ] `import { LinearGradient } from 'expo-linear-gradient'` compiles
- [ ] `import { BlurView } from 'expo-blur'` renders on iOS + Android

---

## Phase D1: Dark Mode Conversion (Days 3–5)

> _Flip every screen from light (#F9FAFB) to nocturne (#0A0B1E). This is the single biggest visual impact._

### D1.1 — Convert All Screen Backgrounds

**Files to change (10 screens):**

| File | Current bg | New bg |
|------|-----------|--------|
| `DiscoverScreen.tsx` | `#F9FAFB` | `dark.bg.primary` (#0A0B1E) |
| `ConversationsScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `GalleryScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `ProfileScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `ChatScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `SubscriptionScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `EditProfileScreen.tsx` | `#FFFFFF` | `dark.bg.primary` |
| `TransactionHistoryScreen.tsx` | `#F9FAFB` | `dark.bg.primary` |
| `LoginScreen.tsx` | `#FFFFFF` | `dark.bg.primary` |
| `RegisterScreen.tsx` | `#FFFFFF` | `dark.bg.primary` |

**For each screen, also convert:**
- Card backgrounds: `#FFFFFF` → `dark.bg.secondary` (#111827)
- Input backgrounds: `#F3F4F6` → `dark.bg.tertiary` (#1F2937)
- Borders: `#E5E7EB` → `dark.surface.glassBorder`
- Primary text: `#1F2937` → `dark.text.primary` (#F5F3FF)
- Secondary text: `#6B7280` → `dark.text.secondary` (#A1A1AA)
- Tertiary text: `#9CA3AF` → `dark.text.tertiary` (#52525B)
- Purple accent: `#8B5CF6` → `dark.accent.lilac` (#8B7FFF)
- Shadows: reduce opacity (dark bg doesn't need heavy shadows)

**Pattern — Find & Replace per file:**

```
#F9FAFB   → dark.bg.primary    (#0A0B1E)
#FFFFFF   → dark.bg.secondary  (#111827)
#F3F4F6   → dark.bg.tertiary   (#1F2937)
#E5E7EB   → rgba(255,255,255,0.08)
#1F2937   → dark.text.primary  (#F5F3FF)
#374151   → dark.text.primary  (#F5F3FF)
#6B7280   → dark.text.secondary (#A1A1AA)
#9CA3AF   → dark.text.tertiary  (#52525B)
#8B5CF6   → dark.accent.lilac   (#8B7FFF)
```

**Validation:**
- [ ] Every screen renders on dark background
- [ ] No white flashes between screen transitions
- [ ] Text is readable on dark backgrounds (contrast ratio 4.5:1+)
- [ ] Status bar: light content on dark background

---

### D1.2 — Convert Tab Bar to Glass

**File:** `apps/mobile/src/navigation/MainTabNavigator.tsx`

**Current:** White tab bar with gray border. Light theme.

**After:**

```typescript
import { BlurView } from 'expo-blur';

tabBar: (props) => (
  <BlurView intensity={40} tint="dark" style={styles.tabBarBlur}>
    <DefaultTabBar {...props} />
  </BlurView>
),

// Or simpler approach without BlurView:
tabBarStyle: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 88,
  backgroundColor: 'rgba(10, 11, 30, 0.92)',
  borderTopWidth: 1,
  borderTopColor: 'rgba(255, 255, 255, 0.06)',
  paddingTop: 8,
  paddingBottom: 28, // safe area
},
tabBarActiveTintColor: '#8B7FFF',
tabBarInactiveTintColor: '#52525B',
```

**Tab icons:** Replace placeholder circles with Lucide icons:
- Discover: `Compass`
- Conversations: `MessageCircle`
- Gallery: `Image`
- Profile: `User`

**Active indicator:** Small lilac dot (4x4px) below active icon.

**Validation:**
- [ ] Tab bar is semi-transparent dark glass
- [ ] Content scrolls behind tab bar (visible through blur)
- [ ] Active tab has lilac icon + dot indicator
- [ ] Safe area inset correct on iPhone (notch) and Android

---

### D1.3 — Convert Chat Bubbles

**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`

**User bubble:**
```typescript
// Before: backgroundColor: '#8B5CF6'
// After:
backgroundColor: '#8B7FFF',
borderRadius: 20,
borderBottomRightRadius: 6,
```

**AI bubble:**
```typescript
// Before: backgroundColor: '#FFFFFF'
// After:
backgroundColor: 'rgba(255, 255, 255, 0.04)',
borderWidth: 1,
borderColor: 'rgba(255, 255, 255, 0.08)',
borderRadius: 20,
borderBottomLeftRadius: 6,
// text color: '#E4E4E7' instead of '#1F2937'
```

**Chat background:**
```typescript
// Before: '#F9FAFB'
// After: '#0A0B1E'
```

**Header:**
```typescript
// Before: backgroundColor: '#FFFFFF'
// After:
backgroundColor: 'rgba(10, 11, 30, 0.92)',
borderBottomColor: 'rgba(255, 255, 255, 0.06)',
```

**Input area:**
```typescript
// Before: backgroundColor: '#F9FAFB', input '#F3F4F6'
// After:
containerBg: 'rgba(10, 11, 30, 0.95)',
inputBg: 'rgba(255, 255, 255, 0.04)',
inputBorder: 'rgba(255, 255, 255, 0.08)',
inputText: '#F5F3FF',
placeholder: '#52525B',
```

**Validation:**
- [ ] Chat screen fully dark
- [ ] User bubbles: lilac, right-aligned
- [ ] AI bubbles: glass surface, left-aligned
- [ ] Text readable in both bubble types
- [ ] Input area blends with background, not jarring

---

## Phase D2: Card & Component Polish (Days 6–9)

> _Transform generic components into premium glass surfaces._

### D2.1 — Character Cards (DiscoverScreen)

**File:** `apps/mobile/src/screens/main/DiscoverScreen.tsx`

**Changes:**
1. Card background: `dark.bg.secondary` with glass border
2. Image: full card fill with gradient overlay at bottom
3. Text overlay on image (name + count) instead of below
4. Press animation: spring scale 1 → 0.97
5. Image component: replace `<Image>` with expo-image + blurhash

```typescript
// Card component
<Animated.View style={[styles.card, animatedStyle]}>
  <Pressable
    onPressIn={() => {
      scale.value = withSpring(0.97, spring.snappy);
      haptic.light();
    }}
    onPressOut={() => {
      scale.value = withSpring(1, spring.gentle);
    }}
    onPress={() => navigation.navigate('CharacterDetail', { characterId })}
  >
    <ExpoImage
      source={avatarUrl}
      placeholder={blurhash}
      contentFit="cover"
      transition={200}
      style={styles.cardImage}
    />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.7)']}
      style={styles.cardOverlay}
    >
      <Text style={styles.cardName}>{displayName}</Text>
      <Text style={styles.cardMeta}>{conversationCount} chats</Text>
    </LinearGradient>
  </Pressable>
</Animated.View>
```

**Card styles:**
```typescript
card: {
  borderRadius: radius.xl, // 20
  overflow: 'hidden',
  backgroundColor: dark.bg.secondary,
  borderWidth: 1,
  borderColor: dark.surface.glassBorder,
},
cardImage: {
  width: '100%',
  aspectRatio: 3 / 4,
},
cardOverlay: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: space.lg, // 16
},
cardName: {
  fontSize: fontSize.bodyL, // 17
  fontWeight: fontWeight.semibold,
  color: dark.text.primary,
},
cardMeta: {
  fontSize: fontSize.caption, // 11
  color: dark.text.secondary,
  marginTop: space.xs, // 4
},
```

**Validation:**
- [ ] Cards have glass border + dark background
- [ ] Image fills card with gradient text overlay
- [ ] Press feedback: scale spring + haptic
- [ ] No layout shift during image load (blurhash fills space)

---

### D2.2 — Conversation Items

**File:** `apps/mobile/src/components/ConversationItem.tsx`

**Changes:**
1. Background: transparent (inherits dark bg)
2. Border: `rgba(255,255,255,0.05)` bottom separator
3. Text: primary/secondary/tertiary hierarchy
4. Avatar: expo-image with blurhash fallback
5. Press: subtle background highlight `rgba(255,255,255,0.03)`

```typescript
container: {
  flexDirection: 'row',
  paddingHorizontal: space.xl, // 20
  paddingVertical: space.md,   // 12
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: dark.surface.glassBorder,
},
name: {
  fontSize: fontSize.bodyM,    // 15
  fontWeight: fontWeight.semibold,
  color: dark.text.primary,
},
preview: {
  fontSize: fontSize.bodyS,    // 13
  color: dark.text.secondary,
},
time: {
  fontSize: fontSize.caption,  // 11
  color: dark.text.tertiary,
},
```

---

### D2.3 — Search Inputs (Global Pattern)

**Applies to:** DiscoverScreen, ConversationsScreen

**Glass search pattern:**
```typescript
searchContainer: {
  paddingHorizontal: space.xl,
  paddingVertical: space.md,
},
searchInput: {
  backgroundColor: dark.surface.glass,
  borderWidth: 1,
  borderColor: dark.surface.glassBorder,
  borderRadius: radius.md, // 12
  height: 44,
  paddingHorizontal: space.lg, // 16
  fontSize: fontSize.bodyM,
  color: dark.text.primary,
},
// On focus: borderColor → 'rgba(139, 127, 255, 0.3)'
```

---

### D2.4 — Profile Screen Glass Sections

**File:** `apps/mobile/src/screens/main/ProfileScreen.tsx`

**Changes:**
1. Background: dark.bg.primary
2. Sections: glass cards (not white)
3. Avatar: glow ring (lilac shadow)
4. Menu items: dark separators, lilac chevrons
5. Credits card: glass-accent with gradient border

```typescript
section: {
  backgroundColor: dark.surface.glass,
  borderWidth: 1,
  borderColor: dark.surface.glassBorder,
  borderRadius: radius.xl,
  marginBottom: space.lg,
  overflow: 'hidden',
},
creditsCard: {
  backgroundColor: 'rgba(139, 127, 255, 0.08)',
  borderWidth: 1,
  borderColor: 'rgba(139, 127, 255, 0.15)',
  borderRadius: radius.xl,
  padding: space.xl,
  ...shadow.glow('#8B7FFF', 0.15),
},
menuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: space.lg,
  paddingVertical: space.md + space.xs, // 16
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: dark.surface.glassBorder,
},
menuText: {
  fontSize: fontSize.bodyM,
  color: dark.text.primary,
},
```

---

## Phase D3: Motion & Micro-interactions (Days 10–13)

> _Make everything feel alive. Nothing is static._

### D3.1 — Message Entry Animations

**File:** `apps/mobile/src/screens/chat/ChatScreen.tsx`

**User message (sent):**
```typescript
// When message added to list:
entering={SlideInRight.springify().damping(20).stiffness(200)}
```

**AI message (received):**
```typescript
// Blur-fade-up entry
entering={FadeIn.duration(250).withInitialValues({
  opacity: 0,
  transform: [{ translateY: 8 }],
})}
```

**Streaming cursor:**
```typescript
// Blinking cursor at end of streaming text
const cursorOpacity = useSharedValue(1);
useEffect(() => {
  cursorOpacity.value = withRepeat(
    withTiming(0, { duration: 500 }),
    -1, true,
  );
}, []);

// Render: thin lilac bar (2px wide, 16px tall) after last character
```

---

### D3.2 — Screen Transition Animations

**File:** `apps/mobile/src/navigation/MainStackNavigator.tsx`

```typescript
screenOptions: {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: { damping: 20, stiffness: 300, mass: 0.8 },
    },
    close: {
      animation: 'spring',
      config: { damping: 25, stiffness: 350, mass: 0.8 },
    },
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',
},
```

**Tab switch:** Cross-fade (not slide):
```typescript
// MainTabNavigator
tabBarAnimationDuration: 200,
animation: 'fade',
```

---

### D3.3 — Card Press Animation (Reusable Hook)

**New file:** `apps/mobile/src/hooks/usePressAnimation.ts`

```typescript
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { spring } from '@/theme';
import { haptic } from '@/utils/haptics';

export function usePressAnimation(baseScale = 1, pressedScale = 0.97) {
  const scale = useSharedValue(baseScale);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(pressedScale, spring.snappy);
    haptic.light();
  };

  const onPressOut = () => {
    scale.value = withSpring(baseScale, spring.gentle);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
```

**Usage everywhere:**
```tsx
const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

<Animated.View style={[styles.card, animatedStyle]}>
  <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
    {/* card content */}
  </Pressable>
</Animated.View>
```

---

### D3.4 — Shimmer Skeleton (Replace Opacity Pulse)

**File:** `apps/mobile/src/components/LoadingSkeleton.tsx`

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Shimmer effect: gradient band sweeps left → right
const translateX = useSharedValue(-width);

useEffect(() => {
  translateX.value = withRepeat(
    withTiming(width, { duration: 1500, easing: Easing.linear }),
    -1, false,
  );
}, []);

const shimmerStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));

return (
  <View style={[styles.skeleton, { width, height, borderRadius }]}>
    <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.06)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  </View>
);

// Base skeleton color: dark.bg.tertiary (#1F2937)
```

---

### D3.5 — Credit Badge with Roll Counter

**File:** `apps/mobile/src/components/AnimatedCreditBadge.tsx`

**Current:** Scale pulse only.

**Enhanced:**
```typescript
// 1. Number scrolls vertically (old value slides up, new slides in)
const translateY = useSharedValue(0);
const newTranslateY = useSharedValue(20);

// On credit change:
translateY.value = withTiming(-20, { duration: 200 }); // old slides up
newTranslateY.value = withSpring(0, spring.snappy);    // new slides in

// 2. Scale pulse
scale.value = withSequence(
  withSpring(1.15, spring.snappy),
  withSpring(1, spring.gentle),
);

// 3. Tint flash
// Green for gain, red for loss (100ms background tint)
const bgColor = useSharedValue('transparent');
bgColor.value = withSequence(
  withTiming(delta > 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', { duration: 0 }),
  withTiming('transparent', { duration: 300 }),
);

// 4. Haptic
haptic.success();
```

---

## Phase D4: Discover Overhaul (Days 14–17)

> _Transform the catalog into an immersive gallery experience._

### D4.1 — Hero Card at Top

**Concept:** First character fills the top of the screen as a "featured" hero. Creates the "Aha!" moment.

```typescript
// Hero: full width, 60% of screen height
heroContainer: {
  width: screenWidth,
  height: screenHeight * 0.6,
  position: 'relative',
},
heroImage: {
  width: '100%',
  height: '100%',
},
heroOverlay: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: space.xl,
},
heroTitle: {
  fontSize: fontSize.displayL,
  fontWeight: fontWeight.bold,
  color: dark.text.primary,
},
heroSubtitle: {
  fontSize: fontSize.bodyM,
  color: dark.text.secondary,
  marginTop: space.xs,
},
heroCTA: {
  marginTop: space.lg,
  backgroundColor: dark.accent.lilac,
  paddingVertical: space.md,
  paddingHorizontal: space['2xl'],
  borderRadius: radius.md,
  alignSelf: 'flex-start',
  ...shadow.glow('#8B7FFF', 0.4),
},
```

**Parallax:** Hero image translates at 0.5x scroll speed:
```typescript
const scrollY = useSharedValue(0);
const heroTranslate = useAnimatedStyle(() => ({
  transform: [{ translateY: scrollY.value * 0.5 }],
}));
```

---

### D4.2 — Bento Grid Below Hero

**Layout logic:**
```typescript
// Row pattern: [small, small], [feature], [small, small], [feature], ...
function getBentoLayout(index: number): 'small' | 'feature' {
  const row = Math.floor(index / 3); // every 3 items = 1 cycle
  const pos = index % 3;
  if (pos === 2) return 'feature'; // 3rd item in cycle is feature
  return 'small';
}
```

**Small cards:** `(screenWidth - space.xl * 2 - space.sm) / 2` wide, 3:4 aspect
**Feature cards:** full width, 2:1 aspect, shows description text

---

### D4.3 — Category Filter Sheet

**Current:** Horizontal chip list. Cramped on small screens.

**New:** Pull down from top → bottom sheet with category grid:
```
┌─────────────────────┐
│ ──── (drag handle)   │
│                      │
│ [Romance] [Friend]   │
│ [Mentor]  [Anime]    │
│ [Game]    [Movie]    │
│ [All]                │
└─────────────────────┘
```

- Opens via swipe-down gesture or filter icon in header
- Glass background with blur
- Category pills with active indicator (lilac fill)

---

## Phase D5: Gallery Overhaul (Days 18–20)

> _Make the gallery feel like a museum, not a file browser._

### D5.1 — Masonry Layout

Replace 2-column equal grid with variable-height masonry:

```typescript
// Use two columns with running height tracking
const leftHeight = useRef(0);
const rightHeight = useRef(0);

items.forEach(item => {
  const aspect = item.width / item.height || 1;
  const cardWidth = (screenWidth - space.xl * 2 - space.sm) / 2;
  const cardHeight = cardWidth / aspect;

  if (leftHeight.current <= rightHeight.current) {
    leftColumn.push(item);
    leftHeight.current += cardHeight + space.sm;
  } else {
    rightColumn.push(item);
    rightHeight.current += cardHeight + space.sm;
  }
});
```

### D5.2 — Shared Element Transition

When tapping gallery image → full screen:
```
Grid image → scales up → fills screen → background darkens
```

Using Reanimated layout animations:
```typescript
<Animated.View layout={Layout.springify().damping(15)} />
```

### D5.3 — Blurhash Placeholders

Every gallery image shows lilac-tinted blurhash while loading:
```typescript
<ExpoImage
  source={item.resultUrl}
  placeholder={item.blurDataUrl || DEFAULT_BLURHASH}
  transition={300}
  cachePolicy="memory-disk"
  style={styles.galleryImage}
/>
```

---

## Phase D6: Premium Polish (Days 21–24)

> _The details that separate "good app" from "award-winning app."_

### D6.1 — Haptic Integration (All Screens)

| Screen | Action | Haptic |
|--------|--------|--------|
| Discover | Card press | `haptic.light()` |
| Discover | Pull to refresh | `haptic.medium()` |
| Chat | Send message | `haptic.light()` |
| Chat | Receive response | `haptic.success()` |
| Chat | Image generated | `haptic.success()` |
| Gallery | Image tap | `haptic.light()` |
| Gallery | Share | `haptic.light()` |
| Profile | Logout confirm | `haptic.warning()` |
| Profile | Credit purchase | `haptic.success()` |
| Tab bar | Tab switch | `haptic.select()` |
| Any | Error state | `haptic.error()` |
| Any | Pull to refresh | `haptic.medium()` |

### D6.2 — Empty State Illustrations

Replace text-only empty states with Lottie animations:

```bash
npx expo install lottie-react-native
```

| Screen | Empty State | Lottie |
|--------|-------------|--------|
| Conversations | No chats | Floating chat bubbles animation |
| Gallery | No media | Camera shutter animation |
| Search | No results | Magnifying glass wiggle |
| Transactions | No history | Coins floating animation |

### D6.3 — Status Bar Handling

Every screen should set status bar to light content:
```typescript
import { StatusBar } from 'expo-status-bar';

// In every screen root:
<StatusBar style="light" />
```

### D6.4 — Safe Area Consistency

Ensure all screens use `SafeAreaView` from `react-native-safe-area-context`:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

// edges prop: ['top'] for screens with custom bottom (tab bar)
// edges prop: ['top', 'bottom'] for full-screen modals
```

---

## Milestone Summary

| Phase | Days | Impact | Key Deliverable |
|-------|------|--------|----------------|
| **D0** | 1–2 | Foundation | Theme tokens (colors, type, spacing, animation) |
| **D1** | 3–5 | Massive visual shift | Dark mode conversion (all 10 screens + tab bar + chat) |
| **D2** | 6–9 | Premium feel | Glass cards, glass search, glass profile, glass conversations |
| **D3** | 10–13 | Alive feel | Message animations, press hooks, shimmer, credit roll |
| **D4** | 14–17 | Aha moment | Hero card, bento grid, parallax, category sheet |
| **D5** | 18–20 | Gallery premium | Masonry, shared transitions, blurhash |
| **D6** | 21–24 | Award polish | Haptics everywhere, Lottie empties, status bar, safe area |

---

## Appendix A: File Change Index

### Phase D0 (New files)
```
apps/mobile/src/theme/colors.ts        [NEW]
apps/mobile/src/theme/typography.ts     [NEW]
apps/mobile/src/theme/spacing.ts        [NEW]
apps/mobile/src/theme/animation.ts      [NEW]
apps/mobile/src/theme/index.ts          [NEW]
apps/mobile/package.json                — add expo-linear-gradient, expo-blur
```

### Phase D1 (Conversions)
```
apps/mobile/src/screens/main/DiscoverScreen.tsx
apps/mobile/src/screens/main/ConversationsScreen.tsx
apps/mobile/src/screens/main/GalleryScreen.tsx
apps/mobile/src/screens/main/ProfileScreen.tsx
apps/mobile/src/screens/chat/ChatScreen.tsx
apps/mobile/src/screens/subscription/SubscriptionScreen.tsx
apps/mobile/src/screens/profile/EditProfileScreen.tsx
apps/mobile/src/screens/profile/TransactionHistoryScreen.tsx
apps/mobile/src/screens/auth/LoginScreen.tsx
apps/mobile/src/screens/auth/RegisterScreen.tsx
apps/mobile/src/navigation/MainTabNavigator.tsx
```

### Phase D2 (Component polish)
```
apps/mobile/src/components/ConversationItem.tsx
apps/mobile/src/screens/main/ProfileScreen.tsx
```

### Phase D3 (Motion)
```
apps/mobile/src/hooks/usePressAnimation.ts        [NEW]
apps/mobile/src/components/LoadingSkeleton.tsx
apps/mobile/src/components/AnimatedCreditBadge.tsx
apps/mobile/src/screens/chat/ChatScreen.tsx
apps/mobile/src/navigation/MainStackNavigator.tsx
```

### Phase D4 (Discover)
```
apps/mobile/src/screens/main/DiscoverScreen.tsx    — full rewrite
apps/mobile/src/components/discover/HeroCard.tsx   [NEW]
apps/mobile/src/components/discover/BentoCard.tsx  [NEW]
```

### Phase D5 (Gallery)
```
apps/mobile/src/screens/main/GalleryScreen.tsx     — masonry + transitions
```

### Phase D6 (Polish)
```
All 10+ screens                                    — haptic integration
apps/mobile/src/components/EmptyState.tsx           [NEW] — Lottie wrapper
apps/mobile/package.json                            — add lottie-react-native
```

---

## Appendix B: Before/After Visual Summary

| Element | Before | After |
|---------|--------|-------|
| Background | `#F9FAFB` (light gray) | `#0A0B1E` (deep nocturne) |
| Cards | White + shadow | Glass surface + border |
| Bubbles (AI) | White solid | Glass + emotional gradient |
| Bubbles (User) | Purple solid | Lilac solid + spring entry |
| Tab bar | White + border | Semi-transparent dark glass |
| Inputs | Light gray | Glass with lilac focus |
| Skeletons | Opacity pulse | Gradient shimmer sweep |
| Cards press | No feedback | Spring 0.97 + haptic |
| Avatar | Purple border | Gradient glow ring |
| Credits | Scale pulse | Roll counter + tint flash |
| Discover | 2-col uniform grid | Hero + bento mixed grid |
| Gallery | 2-col uniform grid | Masonry + shared transitions |

---

## Appendix C: Validation Checklist

### Visual
- [ ] All screens on `#0A0B1E` background — no white flashes
- [ ] Glass surfaces visible on all cards, inputs, tab bar
- [ ] Text contrast ratio 4.5:1+ on all dark surfaces
- [ ] Consistent spacing using 8px grid tokens
- [ ] Status bar light content everywhere

### Motion
- [ ] Card press: spring scale + haptic feedback
- [ ] Message entry: fade-blur-up animation
- [ ] Tab switch: cross-fade with haptic.select()
- [ ] Screen push/pop: spring-based slide
- [ ] Skeleton: shimmer sweep (not opacity pulse)
- [ ] Credit change: roll counter + scale pulse

### Performance
- [ ] 60fps scroll in Discover grid (React DevTools Perf Monitor)
- [ ] 60fps scroll in Gallery masonry
- [ ] Chat streaming: no frame drops during text append
- [ ] No layout shift when images load (blurhash fills space)
- [ ] Memory usage < 200MB after 30 min session

### Consistency
- [ ] Every color references theme tokens (no hardcoded hex)
- [ ] Every font size references fontSize tokens
- [ ] Every spacing references space tokens
- [ ] Every radius references radius tokens
- [ ] Every animation uses timing/spring constants
