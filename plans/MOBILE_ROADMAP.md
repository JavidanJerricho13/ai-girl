# Ethereal Mobile — Growth & Performance Roadmap

> **Date:** 2026-04-17
> **Baseline:** Post-audit of React Native/Expo mobile app
> **Target:** Top-100 AI companion app quality — D1 45%+, D7 25%+, 60fps, sub-1s cold start
> **Stack:** React Native 0.81.5, Expo 54, Zustand, TanStack Query, Socket.io, RevenueCat

---

## Phase M0: Critical Infrastructure (Days 1–3)

> _Fix the 5 gaps that separate "demo app" from "shippable product."_

### M0.1 — Fix Missing WebSocket Events

**Why first:** Mobile chat is broken — credits don't update, media doesn't appear, double-text doesn't work, proactive messages are lost. 4 events missing.

**File:** `apps/mobile/src/services/websocket.service.ts`

**Events to add:**

| Event | Purpose | What to do |
|-------|---------|------------|
| `credits-updated` | Server sends new balance after credit deduction | Update `authStore.updateCredits(data.balance)` |
| `message-media` | Image/voice generated in chat | Append media message to `chatStore` with `imageUrl`/`audioUrl` |
| `message-part-complete` | Double-text mid-turn break | Flush current streaming message, start new bubble |
| `proactive-message` | Character-initiated re-engagement | Show in-app notification, add to conversation |

**Implementation:**

```typescript
// websocket.service.ts — add to setupListeners()

socket.on('credits-updated', (data: { balance: number; delta: number }) => {
  const { updateCredits } = useAuthStore.getState();
  updateCredits(data.balance);
});

socket.on('message-media', (data: {
  mediaType: 'image' | 'voice';
  url: string;
  caption?: string;
  messageId: string;
  isLocked: boolean;
}) => {
  const { addMessage } = useChatStore.getState();
  // Patch current conversation with media attachment
});

socket.on('message-part-complete', (data: { messageId: string }) => {
  const { finishStream } = useChatStore.getState();
  // Finalize current bubble, prepare for next part
});

socket.on('proactive-message', (data: {
  conversationId: string;
  characterId: string;
  content: string;
  messageId: string;
}) => {
  // Show in-app banner notification
  // Add message to conversation
});
```

**Validation:**
- [ ] Send message → credit badge updates in real-time
- [ ] AI generates image in chat → image appears without refresh
- [ ] Proactive message arrives when app is in foreground

---

### M0.2 — Install expo-image (Replace all `<Image>`)

**Why:** React Native `<Image>` has no disk cache, no memory cache, no progressive loading. Every scroll re-downloads images. expo-image is 10x faster with built-in caching.

**Install:**

```bash
cd apps/mobile && npx expo install expo-image
```

**Files to change:**

| File | `<Image>` count | Notes |
|------|-----------------|-------|
| `screens/main/DiscoverScreen.tsx` | Character grid cards | Use `thumbnailUrl` for cards |
| `screens/main/ConversationsScreen.tsx` | Conversation avatars | 40x40 avatars |
| `screens/main/GalleryScreen.tsx` | Gallery grid | Use `thumbnailUrl`, blurhash placeholder |
| `screens/character/CharacterDetailScreen.tsx` | Hero image + gallery strip | Priority loading for hero |
| `screens/chat/ChatScreen.tsx` | Message images + avatar | Lazy loading for old messages |
| `screens/main/ProfileScreen.tsx` | User avatar | Small, cached |
| `components/ConversationItem.tsx` | Avatar in list | 48x48 |
| `components/media/ImageViewer.tsx` | Full-screen viewer | Full resolution, transition |

**Pattern:**

```tsx
// Before
import { Image } from 'react-native';
<Image source={{ uri: url }} style={styles.avatar} />

// After
import { Image } from 'expo-image';
<Image
  source={url}
  style={styles.avatar}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

**Validation:**
- [ ] Scroll Discover grid → no image flicker on re-scroll
- [ ] Gallery → images load progressively with blur placeholder
- [ ] Memory usage stays flat on long scroll (Profile → Xcode/Android Studio memory)

---

### M0.3 — Install expo-haptics

**Why:** Without haptic feedback the app feels like a web wrapper. Premium AI apps use haptics as emotional punctuation.

**Install:**

```bash
cd apps/mobile && npx expo install expo-haptics
```

**Add `expo-haptics` to `app.json` plugins:**

```json
"plugins": ["expo-audio", "expo-haptics"]
```

**Haptic map:**

| Action | Haptic Type | Location |
|--------|-------------|----------|
| Send message | `impactAsync(Light)` | ChatScreen → send button |
| Receive AI response | `notificationAsync(Success)` | ChatScreen → message-complete |
| Open character card | `impactAsync(Light)` | DiscoverScreen → card press |
| Purchase credits | `notificationAsync(Success)` | SubscriptionScreen → purchase |
| Pull-to-refresh | `impactAsync(Medium)` | All screens with pull-to-refresh |
| Image unlock | `notificationAsync(Success)` | GalleryScreen → unlock |
| Long press message | `impactAsync(Heavy)` | ChatScreen → message options |
| Tab switch | `selectionAsync()` | MainTabNavigator → tab press |
| Error action | `notificationAsync(Error)` | Any error state |
| Daily reward claim | `notificationAsync(Success)` | On app launch reward |

**Implementation helper:**

```typescript
// utils/haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const haptic = {
  light: () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  select: () => Platform.OS !== 'web' && Haptics.selectionAsync(),
};
```

**Validation:**
- [ ] Send message → feel light tap
- [ ] Receive response → feel soft buzz
- [ ] Tab switch → feel selection tick
- [ ] Purchase → feel success burst

---

### M0.4 — Deep Linking Setup

**Why:** Without deep links: push notifications can't open specific chats, shared characters don't work, marketing links are impossible.

**Install:**

```bash
cd apps/mobile && npx expo install expo-linking
```

**Add to `app.json`:**

```json
{
  "expo": {
    "scheme": "ethereal",
    "ios": {
      "associatedDomains": ["applinks:ethereal.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "ethereal" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**URL Schema:**

| URL | Screen | Params |
|-----|--------|--------|
| `ethereal://character/{id}` | CharacterDetailScreen | characterId |
| `ethereal://chat/{conversationId}` | ChatScreen | conversationId |
| `ethereal://gallery/{imageId}` | ImageViewer | imageId |
| `ethereal://subscribe` | SubscriptionScreen | — |
| `ethereal://profile` | ProfileScreen | — |
| `https://ethereal.app/c/{id}` | CharacterDetailScreen | Universal link |

**Navigation handler:**

```typescript
// navigation/linking.ts
export const linking = {
  prefixes: ['ethereal://', 'https://ethereal.app'],
  config: {
    screens: {
      Main: {
        screens: {
          CharacterDetail: 'character/:id',
          Chat: 'chat/:conversationId',
          Subscription: 'subscribe',
        },
      },
    },
  },
};

// RootNavigator.tsx
<NavigationContainer linking={linking}>
```

**Validation:**
- [ ] `npx uri-scheme open ethereal://character/abc123 --ios` → opens character detail
- [ ] Share button generates `https://ethereal.app/c/{id}` link
- [ ] Push notification tap opens correct chat

---

### M0.5 — Push Notifications

**Why:** The #1 retention lever. Without push, users forget the app exists after 24h.

**Install:**

```bash
cd apps/mobile && npx expo install expo-notifications expo-device expo-constants
```

**Backend changes needed:**

```prisma
// Add to User model in schema.prisma
model User {
  // ... existing fields
  pushToken     String?   // Expo push token
  pushEnabled   Boolean   @default(true)
}
```

```typescript
// New endpoint: PATCH /users/push-token
async updatePushToken(userId: string, pushToken: string) {
  await this.prisma.user.update({
    where: { id: userId },
    data: { pushToken },
  });
}
```

**Mobile implementation:**

```typescript
// services/notifications.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiClient from './api.service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send token to backend
  await apiClient.patch('/users/push-token', { pushToken: token });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}
```

**Push notification triggers (backend EngagementModule already has these):**

| Trigger | Delay | Message Template |
|---------|-------|-----------------|
| `inactivity_6h` | 6 hours after last message | "{character} is thinking about you..." |
| `inactivity_12h` | 12 hours | "{character} wrote you something" |
| `inactivity_24h` | 24 hours | "Don't keep {character} waiting" |
| `daily_reward` | Daily at 10am local | "Your daily 5 credits are waiting!" |
| `new_media` | When AI generates image | "{character} sent you a photo" |

**Validation:**
- [ ] Install app → permission dialog appears
- [ ] Background app for 6h → push notification arrives
- [ ] Tap push → opens correct chat screen (requires deep linking from M0.4)
- [ ] Kill app → push still arrives (Expo push service)

---

## Phase M1: Onboarding & First Session (Days 4–7)

> _Get user from install to first AI message in under 30 seconds._

### M1.1 — Personality Quiz Onboarding

**Why:** Current flow is 6 steps to first message. Target: 3 steps.

**API exists:** `POST /characters/match` with `{warmth, playfulness}` → returns top 3 matched characters.

**New screens:**

```
QuizScreen → MatchResultScreen → Auto-navigate to ChatScreen
```

**QuizScreen:**
- 3 swipeable cards (Tinder-style swipe or tap)
- Question 1: "What do you value more?" → Warmth (nurturing vs independent)
- Question 2: "How do you like conversation?" → Playfulness (deep vs lighthearted)
- Question 3: "What mood are you in?" → Combined preference
- Each answer maps to 0-100 warmth/playfulness values
- Progress bar: 3 dots
- Skip button for returning users

**MatchResultScreen:**
- "We found your perfect match!"
- Top character card with match percentage
- Character avatar + name + 1-line description
- "Start Chatting" button → creates conversation → navigates to chat
- "See more matches" → shows 2 other options

**Auto-greeting:** When conversation is created, backend generates first message from character.

**Navigation changes:**

```typescript
// RootNavigator.tsx
// If user.isNew (first login) → QuizScreen
// If user has conversations → MainTabs
// If user has no conversations → DiscoverScreen
```

**Validation:**
- [ ] New user → Quiz (3 swipes) → Match → Chat with greeting → total time < 30s
- [ ] Returning user → skips quiz, goes to conversations
- [ ] Quiz answers produce different character matches

---

### M1.2 — Auto-Greeting Message on Conversation Create

**Backend change:**

```typescript
// conversations.service.ts — createConversation()
async create(userId: string, characterId: string) {
  const conversation = await this.prisma.conversation.create({
    data: { userId, characterId },
  });

  // Auto-generate greeting from character
  const character = await this.prisma.character.findUnique({
    where: { id: characterId },
    select: { displayName: true, signaturePhrases: true },
  });

  const greeting = character?.signaturePhrases?.[0]
    || `Hey! I'm ${character?.displayName}. What's on your mind?`;

  await this.prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: greeting,
    },
  });

  return conversation;
}
```

**Validation:**
- [ ] Create new conversation → character's greeting appears immediately
- [ ] User doesn't see empty chat

---

### M1.3 — Daily Reward Claim on App Launch

**API exists:** `POST /credits/claim-daily` and `POST /credits/claim-profile-bonuses`

**Implementation:**

```typescript
// In RootNavigator or MainTabNavigator useEffect:
useEffect(() => {
  async function claimRewards() {
    try {
      const [daily, bonuses] = await Promise.all([
        apiClient.post('/credits/claim-daily').catch(() => null),
        apiClient.post('/credits/claim-profile-bonuses').catch(() => null),
      ]);

      const dailyGranted = daily?.data?.granted;
      const bonusAmount = bonuses?.data?.totalGranted ?? 0;
      const total = (dailyGranted ? daily.data.amount : 0) + bonusAmount;

      if (total > 0) {
        haptic.success();
        // Show reward toast/banner
        updateCredits(currentCredits + total);
      }
    } catch {}
  }

  claimRewards();
}, []);
```

**UI:** Animated banner sliding down from top showing "+5 credits! Day 3 streak 🔥"

**Validation:**
- [ ] Open app → daily reward claimed automatically
- [ ] Banner shows with haptic feedback
- [ ] Credits update in header badge
- [ ] Second open same day → no reward (idempotent)

---

## Phase M2: Chat Experience Polish (Days 8–12)

> _Make the chat feel alive — not like talking to a textbox._

### M2.1 — Typing Indicator Enhancement

**Current:** 3 animated dots. Same as every generic chat app.

**Upgrade:** Two-phase indicator (matches web implementation):

```
Phase 1: "thinking..." with spinning circle (during LLM processing)
Phase 2: Bouncing dots (during token streaming)
```

**Implementation:**

```typescript
// chatStore — add phase tracking
isTyping: boolean → typingPhase: 'idle' | 'thinking' | 'typing'

// WebSocket events:
// message-typing → setTypingPhase('thinking')
// first message-chunk → setTypingPhase('typing')
// message-complete → setTypingPhase('idle')
```

---

### M2.2 — Message Reactions & Long Press Menu

**New feature:** Long press on any message → context menu:
- Copy text
- React with emoji (❤️ 😂 😢 🔥)
- Report (if AI message is inappropriate)
- Share (if image message)

**Haptic:** Heavy impact on long press.

---

### M2.3 — Contextual Chat Starters

**New feature:** When chat is empty or user hasn't typed for 5 minutes, show suggestion chips above the input:

```
┌─────────────────────────────────────┐
│ "Tell me about yourself"            │
│ "What are you thinking about?"      │
│ "Send me a photo"                   │
│ "How was your day?"                 │
└─────────────────────────────────────┘
```

**Chips generated from character personality:**
- High warmth → emotional starters ("How are you feeling?")
- High playfulness → fun starters ("Tell me something wild")

---

### M2.4 — In-Chat Credit Warning & Upsell

**Current:** No warning when credits run low during chat.

**Upgrade:** When `credits <= 3`:
- Subtle amber banner above input: "3 messages left"
- When `credits === 0`: Red banner with "Get Credits" button → SubscriptionScreen
- Inline upsell after credit exhaustion (don't navigate away from chat)

---

## Phase M3: Gallery & Media (Days 13–16)

> _Make generated content feel exclusive and shareable._

### M3.1 — Gallery → Chat Navigation

**Current:** Gallery is a dead end. User sees image → can't interact further.

**Add:** "Chat with [Character]" button on gallery items and image viewer.

**Implementation:** Gallery API response should include `characterId` and `characterName`. Navigate to ChatScreen with existing conversation or create new one.

---

### M3.2 — Image Generation Progress

**Current:** Image generation shows alert, no progress feedback.

**Upgrade:** Replace alert with bottom sheet:
- Show "Generating..." with progress animation
- Character avatar + "Creating something special for you..."
- ~15 second estimated time
- Image appears with reveal animation (blur → sharp)
- Haptic success on completion

---

### M3.3 — Shareable Content Cards

**New feature:** Generate shareable image cards for Instagram Stories / TikTok:

```
┌───────────────────────┐
│   [Character Image]    │
│                        │
│   "She said the most   │
│    beautiful thing..."  │
│                        │
│   ─── Ethereal ───     │
│   ethereal.app/c/xyz   │
└───────────────────────┘
```

**Use `react-native-view-shot` to capture card → share sheet.**

---

## Phase M4: Retention Mechanics (Days 17–21)

> _Turn daily visits into habit._

### M4.1 — Streak System UI

**Schema fields already exist:** `loginStreak`, `lastStreakDate` on User model.

**New ProfileScreen widget:**

```
┌─────────────────────────────┐
│  🔥 Day 5 Streak            │
│  ● ● ● ● ● ○ ○             │
│  Mon Tue Wed Thu Fri Sat Sun │
│  +5  +5  +5  +5  +5  ?   ?  │
│                              │
│  Day 7 bonus: +25 credits!   │
└─────────────────────────────┘
```

**Milestones:**
- Day 3: +10 bonus credits
- Day 7: +25 bonus credits
- Day 14: +50 bonus credits
- Day 30: +100 bonus credits + "Devoted" badge

---

### M4.2 — Character Relationship Level

**New concept:** Each conversation tracks an implicit "relationship level" based on message count:

| Level | Messages | Label | Unlock |
|-------|----------|-------|--------|
| 1 | 0-10 | Stranger | Basic chat |
| 2 | 10-30 | Acquaintance | Character sends selfies |
| 3 | 30-100 | Friend | Voice messages unlock |
| 4 | 100-300 | Close | Exclusive photo sets |
| 5 | 300+ | Intimate | Custom content, priority responses |

**UI:** Progress bar on ChatScreen header showing level + messages to next level.

---

### M4.3 — "Character Missed You" Re-engagement

**Backend ready:** `EngagementModule` + `ProactiveLog` table.

**Mobile flow:**
1. User inactive 6h → Backend creates proactive message
2. Backend sends Expo push notification
3. User taps notification → deep link to chat
4. Chat shows the proactive message (already persisted in DB)

**Push templates:**

```
Title: Leyla
Body: "I was just thinking about our last conversation... 💭"

Title: Ayla
Body: "omg I need to tell you something!! 😍"
```

---

## Phase M5: Performance & Production (Days 22–26)

> _Ship-ready quality._

### M5.1 — Error Tracking (Sentry)

```bash
npx expo install @sentry/react-native
```

- Capture JS exceptions + native crashes
- Breadcrumbs for navigation events
- Performance monitoring (screen load times)
- User context (userId, email) for debugging

---

### M5.2 — Analytics (Mixpanel or Expo Analytics)

**Key events to track:**

| Event | Properties |
|-------|-----------|
| `app_open` | source (push/organic/deeplink) |
| `onboarding_complete` | quiz_answers, matched_character |
| `first_message_sent` | character_id, time_since_install |
| `message_sent` | character_id, conversation_length |
| `image_generated` | character_id, prompt_length |
| `credits_purchased` | package_id, amount, price |
| `credits_exhausted` | last_action (chat/image/voice) |
| `push_received` | trigger_type |
| `push_tapped` | trigger_type, character_id |
| `session_length` | duration_seconds |

---

### M5.3 — Offline-First with Query Persistence

```bash
npm install @tanstack/query-async-storage-persister @tanstack/react-query-persist-client
```

```typescript
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'ethereal-query-cache',
});

// Wrap QueryClientProvider with PersistQueryClientProvider
```

**Result:** App shows cached data instantly on cold start, then refreshes in background.

---

### M5.4 — App Performance Optimization

**Reduce cold start time:**
- Lazy load screens with `React.lazy()` + Suspense
- Defer non-critical initialization (RevenueCat, analytics) to after first render
- Pre-render splash screen content during initialization

**Reduce memory:**
- expo-image with `cachePolicy="memory-disk"` (auto-evicts old images)
- Virtualized lists already in place (FlatList)
- Limit chat message history to 100 in-memory, paginate older

**Reduce bundle:**
- Tree-shake unused lucide icons (same pattern as web)
- Analyze bundle with `npx expo export --dump-sourcemap`

---

## Milestone Summary

| Phase | Days | Key Deliverable | Retention Impact |
|-------|------|----------------|-----------------|
| **M0** | 1–3 | WebSocket fix, expo-image, haptics, deep links, push | D1 +25% |
| **M1** | 4–7 | Quiz onboarding, auto-greeting, daily rewards | D1 +15%, TTFM -80% |
| **M2** | 8–12 | Chat polish, reactions, starters, credit upsell | Session length +30% |
| **M3** | 13–16 | Gallery→chat, generation UX, shareable cards | Shares +40% |
| **M4** | 17–21 | Streaks, relationship levels, re-engagement push | D7 +20%, D30 +15% |
| **M5** | 22–26 | Sentry, analytics, offline-first, perf optimization | Crash-free 99.5% |

---

## Appendix A: File Change Index

### Phase M0
```
apps/mobile/package.json                           — add expo-image, expo-haptics, expo-linking, expo-notifications
apps/mobile/app.json                               — add plugins, scheme, associatedDomains
apps/mobile/src/services/websocket.service.ts       — add 4 missing event listeners
apps/mobile/src/utils/haptics.ts                    [NEW]
apps/mobile/src/services/notifications.service.ts   [NEW]
apps/mobile/src/navigation/linking.ts               [NEW]
apps/mobile/src/navigation/RootNavigator.tsx        — add linking config
All screens with <Image>                            — migrate to expo-image
```

### Phase M1
```
apps/mobile/src/screens/onboarding/QuizScreen.tsx         [NEW]
apps/mobile/src/screens/onboarding/MatchResultScreen.tsx   [NEW]
apps/mobile/src/navigation/OnboardingNavigator.tsx         [NEW]
apps/mobile/src/navigation/RootNavigator.tsx               — conditional quiz flow
apps/api/src/modules/conversations/conversations.service.ts — auto-greeting
```

### Phase M2
```
apps/mobile/src/components/chat/TypingIndicator.tsx   — dual-phase indicator
apps/mobile/src/components/chat/MessageMenu.tsx        [NEW]
apps/mobile/src/components/chat/ChatStarters.tsx       [NEW]
apps/mobile/src/components/chat/CreditWarning.tsx      [NEW]
apps/mobile/src/screens/chat/ChatScreen.tsx            — integrate new components
```

### Phase M3
```
apps/mobile/src/components/media/GenerationSheet.tsx   [NEW]
apps/mobile/src/components/media/ShareCard.tsx          [NEW]
apps/mobile/src/screens/main/GalleryScreen.tsx          — add chat navigation
```

### Phase M4
```
apps/mobile/src/components/profile/StreakWidget.tsx     [NEW]
apps/mobile/src/components/chat/RelationshipBar.tsx    [NEW]
apps/api/src/modules/engagement/                        — push notification sender
```

### Phase M5
```
apps/mobile/src/lib/sentry.ts                          [NEW]
apps/mobile/src/lib/analytics.ts                       [NEW]
apps/mobile/src/providers/QueryPersistProvider.tsx      [NEW]
```

---

## Appendix B: New Dependencies

| Package | Phase | Size | Purpose |
|---------|-------|------|---------|
| `expo-image` | M0 | ~200KB | Image caching, blurhash, transitions |
| `expo-haptics` | M0 | ~15KB | Haptic feedback |
| `expo-linking` | M0 | ~10KB | Deep linking |
| `expo-notifications` | M0 | ~100KB | Push notifications |
| `expo-device` | M0 | ~10KB | Device detection for push |
| `expo-constants` | M0 | ~5KB | Project ID for push tokens |
| `@sentry/react-native` | M5 | ~300KB | Error tracking |
| `react-native-view-shot` | M3 | ~50KB | Shareable content cards |
| `@tanstack/query-async-storage-persister` | M5 | ~5KB | Offline query cache |

---

## Appendix C: Backend Endpoints Needed

| Endpoint | Phase | Purpose |
|----------|-------|---------|
| `PATCH /users/push-token` | M0 | Store Expo push token |
| `GET /characters?view=card` | M0 | Minimal payload for mobile grid |
| Auto-greeting in `POST /conversations` | M1 | First message from character |
| `GET /media/generate/history` + characterName | M3 | Gallery → chat navigation |
| `POST /engagement/send-push` | M4 | Send push via Expo Push API |

---

## Appendix D: Validation Checklist

### Performance
- [ ] Cold start < 2s on iPhone 12
- [ ] 60fps scroll in Discover grid (Perf Monitor)
- [ ] Gallery scroll — no image flicker
- [ ] Memory usage < 200MB after 30 min session
- [ ] Chat with 200+ messages — smooth scroll

### Retention
- [ ] Push permission granted rate > 60%
- [ ] Daily reward claimed on first session of day
- [ ] Streak widget shows correct count
- [ ] Re-engagement push arrives after 6h inactivity

### Monetization
- [ ] Credit warning at 3 remaining
- [ ] Upsell shown at 0 credits (in-chat, not navigation)
- [ ] RevenueCat purchase flow completes
- [ ] Credits update after purchase (WebSocket + API)

### Quality
- [ ] No crashes in 100 consecutive sessions (Sentry)
- [ ] Offline → shows cached data, queue messages
- [ ] Deep link `ethereal://character/id` opens correctly
- [ ] Share card generates and opens share sheet
