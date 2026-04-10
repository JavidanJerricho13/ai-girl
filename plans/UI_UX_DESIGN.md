# Ethereal Platform — Complete UI/UX Design Document

## Context

Ethereal is an AI character companion platform with a NestJS API (`apps/api`), Next.js web app (`apps/web`), and React Native mobile app (`apps/mobile`). The API has 14 data models, 30+ REST endpoints, and WebSocket chat with streaming. The web app currently has only 4 pages (Landing, Login, Register, Chat). The mobile app has several screens but `ConversationsScreen` and `CharacterDetailScreen` are stubs. This document provides a complete UI/UX design for both the **main user interface** and an **admin backoffice panel**.

---

# PART 1: MAIN USER INTERFACE (Web & Mobile)

---

## 1.1 Information Architecture

### Web Sitemap

```
/                          Landing (public)
/login                     Auth - Login
/register                  Auth - Register
/discover                  [NEW] Character browsing grid
/characters/:id            [NEW] Character detail page
/chat                      [REDESIGN] Conversation hub
/chat/:conversationId      [REDESIGN] Active chat
/profile                   [NEW] User profile
/profile/edit              [NEW] Edit profile
/credits                   [NEW] Credit management + transactions
/gallery                   [NEW] Generated media gallery
/settings                  [NEW] App settings
```

### Mobile Screen Hierarchy

```
Auth Stack:
  LoginScreen              (exists)
  RegisterScreen            (exists)

Main Tab Navigator:
  Tab 1: Discover           (exists — character grid)
  Tab 2: Chats              [IMPLEMENT — currently stub]
  Tab 3: Gallery            [NEW — media gallery tab]
  Tab 4: Profile            (exists)

Stack Screens (push/modal):
  CharacterDetail           [IMPLEMENT — currently stub]
  Chat                      (exists)
  VideoCall                 (exists)
  Subscription              (exists)
  EditProfile               [NEW]
  TransactionHistory        [NEW]
  Settings                  [NEW]
  Search                    [NEW — modal]
  ImageViewer               [NEW — full-screen image]
```

---

## 1.2 User Flows

### Flow 1: Onboarding (New User)

```
Landing Page ──▶ Register ──▶ (auto-login) ──▶ Discover Page
                                                    │
                                           First-time tooltip:
                                           "Pick a character to
                                            start chatting!"
                                                    │
                                            Tap character card
                                                    │
                                            Character Detail
                                                    │
                                            "Start Chat" button
                                                    │
                                            POST /conversations
                                                    │
                                            Chat Screen
                                         (character sends greeting)
```

### Flow 2: Returning User — Resume Chat

```
App Open ──▶ Auth check (GET /auth/me)
                  │
            Conversations Tab
            (GET /conversations, sorted by lastMessageAt)
                  │
            Tap conversation row
                  │
            Chat Screen
            (GET /conversations/:id + WebSocket join)
```

### Flow 3: Discovering a New Character

```
Discover Tab ──▶ Browse grid / swipe categories
                      │
                (optional) Search icon ──▶ Search modal
                (GET /characters?search=query&category=X)
                      │
                Tap character card
                      │
                Character Detail (GET /characters/:id)
                      │
                View personality, gallery, stats
                      │
                "Start Chat" ──▶ POST /conversations ──▶ Chat Screen
```

### Flow 4: Generating Media in Chat

```
Chat Screen ──▶ Tap attachment icon (+ menu)
                      │
                ┌─────┼─────────────┐
                │     │             │
           Gen Image  Gen Voice  Video Call
           (10 cr.)   (3 cr.)   (navigate)
                │
        Prompt input sheet ──▶ Submit
                │
        Loading placeholder (poll GET /media/generate/jobs/:id)
                │
        Image rendered inline in chat
        Credit badge animates to new value
```

### Flow 5: Credit Management

```
Profile / Credit badge tap ──▶ Credits page
                                    │
                              Balance display (GET /users/credits)
                                    │
                              Cost breakdown: chat=1, image=10/20, voice=3
                                    │
                              "Buy Credits" ──▶ RevenueCat packages
                                    │
                              "Transaction History" (GET /users/transactions)
```

### Flow 6: Profile Management

```
Profile Tab ──▶ Avatar, name, email display (GET /users/profile)
                      │
                "Edit Profile" ──▶ Edit screen
                Fields: firstName, lastName, avatar, bio, language, nsfwEnabled
                      │
                "Save" ──▶ PATCH /users/profile
```

---

## 1.3 Web Page Specifications

### 1.3.1 Landing Page `/` (Redesign)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo] Ethereal                    [Login]  [Get Started]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  gradient bg (purple-900 → indigo-900)                   │
│                                                          │
│         Welcome to Ethereal                              │
│         Your Personal AI Companion Platform              │
│                                                          │
│  [Animated character cards carousel — featured chars]    │
│                                                          │
│         [Get Started]         [Learn More]               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Features Grid (3 columns):                              │
│  Intelligent Chat | Image Generation | Voice & Video     │
├──────────────────────────────────────────────────────────┤
│  Social proof: "10,000+ conversations" etc.              │
├──────────────────────────────────────────────────────────┤
│  Footer: Terms | Privacy | Contact                       │
└──────────────────────────────────────────────────────────┘
```

**Changes from current:** Add nav bar, character preview carousel (optional `GET /characters?isPublic=true&limit=6`), social proof, footer. Keep existing feature cards but expand to cover media gen and voice.

### 1.3.2 Discover Page `/discover` (NEW)

```
┌──────────────────────────────────────────────────────────┐
│ [Sidebar]  │  Discover                 [Search] [Credits]│
│            │                                             │
│ Discover * │  Category chips:                            │
│ Chats      │  [All] [Romance] [Friendship] [Mentor]     │
│ Gallery    │  [Anime] [Celebrity] [Game] [Movie]         │
│ Profile    │                                             │
│            │  Character Grid (3 col desktop, 2 col tablet)│
│            │  ┌──────┐ ┌──────┐ ┌──────┐               │
│            │  │[Img] │ │[Img] │ │[Img] │               │
│            │  │ Name │ │ Name │ │ Name │               │
│            │  │Taglin│ │Premiu│ │Taglin│               │
│            │  │1.2k  │ │ m    │ │ 500  │               │
│            │  └──────┘ └──────┘ └──────┘               │
│            │                                             │
│            │  [Infinite scroll / Load More]               │
└────────────┴─────────────────────────────────────────────┘
```

**Components:** `AppShell` (sidebar + topbar), `CategoryChips`, `CharacterGrid` → `CharacterCard` (image, name, tagline, stats, premium badge), `InfiniteScrollTrigger`

**API:** `GET /characters?category=X&isPublic=true&limit=20&offset=N`, `GET /users/credits`

### 1.3.3 Character Detail `/characters/:id` (NEW)

```
┌──────────────────────────────────────────────────────────┐
│ [← Back]  Character Detail                    [Credits]  │
├──────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────────────────────┐    │
│  │               │  │ Character Name                │    │
│  │  Hero Image   │  │ "Description text..."         │    │
│  │  (profile     │  │                               │    │
│  │   media)      │  │ Categories: [Romance] [Anime] │    │
│  │               │  │ Tags: #tag1 #tag2 #tag3       │    │
│  │               │  │                               │    │
│  │               │  │ Stats:                        │    │
│  │               │  │ 1.2k convos │ 45k msgs │ 4.8★│    │
│  └───────────────┘  │                               │    │
│                      │ Personality:                  │    │
│  Gallery thumbnails  │ Shy  [═══━══════] Bold       │    │
│  [img1][img2][img3]  │ Romantic [══━═══════] Prag.  │    │
│                      │ Playful [════════━═] Serious  │    │
│                      │ Dom. [═════━════] Sub.       │    │
│                      │                               │    │
│                      │ [  Start Chat  ] (primary)    │    │
│                      │ [  Video Call  ] (secondary)  │    │
│                      └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Components:** `CharacterHero`, `CharacterGallery` (horizontal strip from CharacterMedia type=gallery), `CharacterInfo` → `CategoryTags`, `StatCards`, `PersonalitySliders` (read-only), `ActionButtons`, `PremiumGate` (if isPremium && !user.isPremium → upgrade prompt)

**API:** `GET /characters/:id` (with media relation), `POST /conversations` on "Start Chat"

### 1.3.4 Chat Hub `/chat` (Redesign)

```
┌─────┬──────────┬────────────────────────────────────────┐
│ Nav │  Convos  │  Chat Area                              │
│     │          │                                         │
│ Dis │ [+ New]  │  ┌─────────────────────────────────┐   │
│ Cht*│          │  │ [Avatar] Name          [i] [···] │   │
│ Gal │ [Conv 1] │  │ Online / Last seen 2m ago        │   │
│ Pro │  avatar  │  ├─────────────────────────────────┤   │
│     │  name    │  │                                  │   │
│     │  preview │  │  [AI message bubble]             │   │
│     │  time    │  │                                  │   │
│     │ ──────── │  │           [User message bubble]  │   │
│     │ [Conv 2] │  │                                  │   │
│     │  avatar  │  │  [AI message + audio player]     │   │
│     │  name    │  │                                  │   │
│     │  preview │  │  [Typing indicator...]           │   │
│     │  time    │  ├─────────────────────────────────┤   │
│     │          │  │ [+] [Img] [Voice] [msg...] [▶]  │   │
│     │          │  └─────────────────────────────────┘   │
└─────┴──────────┴────────────────────────────────────────┘
```

**Key improvements over current:**
1. Persistent sidebar nav (shared with Discover, Gallery, Profile)
2. Conversation list shows character avatar, name, last message preview, timestamp, unread dot
3. Chat header links to Character Detail
4. Message input includes attachment menu (image gen, voice gen)
5. Consistent dark theme (current mixes `bg-white` ChatWindow with `bg-gray-900` page)
6. "New Chat" button opens a character picker modal

**Components:** `ConversationSidebar` → `NewChatButton` + `CharacterPickerModal`, `ConversationSearch`, `ConversationList` → `ConversationItem`; `ChatArea` → `ChatHeader`, `MessageList` → `MessageBubble` (with media), `TypingIndicator`, `StreamingMessage`; `MessageComposer` → `AttachmentMenu`, `TextInput`, `SendButton`; `EmptyState`

**API:** `GET /conversations`, `GET /conversations/:id`, `POST /conversations`, `DELETE /conversations/:id`, WebSocket (`join-conversation`, `send-message`, `message-chunk`, `message-complete`), `POST /media/generate/image`, `POST /media/generate/voice`

### 1.3.5 Profile Page `/profile` (NEW)

```
┌──────────────────────────────────────────────────────────┐
│ Nav │  Profile                              [Credits]    │
│     ├────────────────────────────────────────────────────┤
│ Dis │  ┌───────────┐  ┌────────────────────────┐       │
│ Cht │  │ [Avatar]  │  │ Username                │       │
│ Gal │  │ Change    │  │ email@example.com       │       │
│ Pro*│  └───────────┘  │ Member since Jan 2026   │       │
│     │                  │ [Edit Profile]          │       │
│     │                  └────────────────────────┘       │
│     │  Credits Card                                     │
│     │  ┌────────────────────────────────────────┐       │
│     │  │ Balance: 85 credits       [Buy More]   │       │
│     │  │ Chat=1  Image=10  Voice=3              │       │
│     │  └────────────────────────────────────────┘       │
│     │  Activity: 12 chars │ 156 msgs │ 8 images         │
│     │  [ Transaction History ] [ Settings ] [ Logout ]   │
└─────┴────────────────────────────────────────────────────┘
```

**API:** `GET /users/profile`, `GET /users/credits`

### 1.3.6 Credits & Transactions `/credits` (NEW)

```
┌──────────────────────────────────────────────────────────┐
│ Nav │  Credits & Billing                                 │
│     ├────────────────────────────────────────────────────┤
│     │  Balance: 85 Credits               [Buy Credits]   │
│     │                                                    │
│     │  Cost Cards:  Chat=1cr  │  Image=10cr  │  Voice=3cr│
│     │                                                    │
│     │  Packages (GET /payments/packages):                 │
│     │  ┌──────┐ ┌──────┐ ┌──────┐                       │
│     │  │500cr │ │1200cr│ │2500cr│                        │
│     │  │$4.99 │ │$9.99 │ │$19.99│                       │
│     │  │[Buy] │ │[Buy] │ │[Buy] │                       │
│     │  └──────┘ └──────┘ └──────┘                       │
│     │                                                    │
│     │  Transaction History (GET /users/transactions):     │
│     │  Apr 10  Chat message       -1    Bal: 85          │
│     │  Apr 10  Image generation  -10    Bal: 86          │
│     │  Apr 09  Credit purchase  +500    Bal: 96          │
└─────┴────────────────────────────────────────────────────┘
```

### 1.3.7 Media Gallery `/gallery` (NEW)

```
┌──────────────────────────────────────────────────────────┐
│ Nav │  My Gallery                     [Filter] [Sort]    │
│     ├────────────────────────────────────────────────────┤
│     │  Tabs: [All] [Images] [Voice]                      │
│     │                                                    │
│     │  Masonry Grid (GET /media/generate/history):        │
│     │  ┌──────┐ ┌──────┐ ┌────┐                         │
│     │  │Image │ │Image │ │Img │                         │
│     │  │prompt│ │prompt│ │    │                          │
│     │  │Apr10 │ │Apr09 │ │    │                          │
│     │  └──────┘ └──────┘ └────┘                          │
│     │  ┌────┐ ┌──────┐ ┌──────┐                          │
│     │  │Img │ │Voice │ │Image │                          │
│     │  │    │ │[Play]│ │      │                          │
│     │  └────┘ └──────┘ └──────┘                          │
│     │  Click → lightbox (full res, prompt, download)     │
└─────┴────────────────────────────────────────────────────┘
```

---

## 1.4 Mobile Screen Specifications

### 1.4.1 Conversations Screen (IMPLEMENT — currently stub)

```
┌────────────────────────────────┐
│ Chats                 [Search] │
├────────────────────────────────┤
│                                │
│ [Avatar] Character Name   2m  │
│          Last message pre...   │
│ ────────────────────────────── │
│ [Avatar] Character Name   1h  │
│          Last message pre...   │
│ ────────────────────────────── │
│ [Avatar] Character Name   2d  │
│          Last message pre...   │
│                                │
│ (Empty state if no convos:)    │
│ Illustration + "No chats yet"  │
│ "Discover characters to start" │
│ [Explore Characters]           │
│                                │
├────────────────────────────────┤
│ [Discover] [Chats*] [Gal] [Me]│
└────────────────────────────────┘
```

**Features:** SearchBar (filter by character name), FlatList → ConversationItem (avatar, character name, last message preview, relative timestamp, unread dot), swipe-left to delete, EmptyState with CTA to Discover.

**API:** `GET /conversations?limit=20&offset=N`, `DELETE /conversations/:id`

### 1.4.2 Character Detail Screen (IMPLEMENT — currently stub)

```
┌────────────────────────────────┐
│ [←]                    [Share] │
│                                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │  Full-bleed Character      │ │
│ │  Profile Image             │ │
│ │  (CharacterMedia           │ │
│ │   type=profile)            │ │
│ │                            │ │
│ │ [img][img][img] gallery    │ │
│ └────────────────────────────┘ │
│                                │
│ Character Display Name         │
│ "Description text..."          │
│                                │
│ [Romance] [Anime] categories  │
│ #sweet #caring #loyal tags    │
│                                │
│ 1.2k Chats │ 45k Msgs │ 4.8★ │
│                                │
│ Personality                    │
│ Shy  [═══━══════] Bold        │
│ Romantic [══━═══════] Prag.   │
│ Playful [════════━═] Serious  │
│ Dom. [═════━════] Sub.        │
│                                │
│ [Premium badge if isPremium]   │
│                                │
│ ┌────────────────────────────┐ │
│ │     Start Chatting         │ │
│ └────────────────────────────┘ │
│ [Video Call]                   │
└────────────────────────────────┘
```

**Logic:** On "Start Chatting", check if user already has an active conversation with this character. If yes → navigate to existing Chat. If no → `POST /conversations` then navigate.

**API:** `GET /characters/:id` (with media relation), `POST /conversations { characterId }`

### 1.4.3 Gallery Tab (NEW)

```
┌────────────────────────────────┐
│ Gallery               [Filter] │
├────────────────────────────────┤
│ [All] [Images] [Audio]         │
│                                │
│ ┌──────┐ ┌──────┐             │
│ │Image │ │Image │             │
│ └──────┘ └──────┘             │
│ ┌──────┐ ┌──────┐             │
│ │Image │ │Audio │             │
│ │      │ │[Play]│             │
│ └──────┘ └──────┘             │
│                                │
│ Tap image → ImageViewer modal  │
│ (pinch-to-zoom, share, save)   │
├────────────────────────────────┤
│ [Discover] [Chats] [Gal*] [Me]│
└────────────────────────────────┘
```

**API:** `GET /media/generate/history?limit=20&offset=N`

### 1.4.4 Search Modal (NEW)

```
┌────────────────────────────────┐
│ [X] [Search input...........] │
├────────────────────────────────┤
│ Recent: "anime girl" "mentor"  │
│ Trending: [Romance] [Anime]   │
│ ────────────────────────────── │
│ (Results appear after typing:) │
│ ┌──────┐ ┌──────┐             │
│ │Char  │ │Char  │             │
│ │Card  │ │Card  │             │
│ └──────┘ └──────┘             │
└────────────────────────────────┘
```

**API:** `GET /characters?search=query&limit=20` (debounced 300ms)

### 1.4.5 Edit Profile Screen (NEW)

```
┌────────────────────────────────┐
│ [←] Edit Profile       [Save] │
├────────────────────────────────┤
│       [Current Avatar]         │
│       [Change Photo]           │
│                                │
│ First Name: [_______________]  │
│ Last Name:  [_______________]  │
│ Username:   [_______________]  │
│ Bio:        [_______________]  │
│             [_______________]  │
│ Language:   [English ▼]        │
│ NSFW:       [Toggle off/on]    │
└────────────────────────────────┘
```

**API:** `GET /users/profile` (pre-populate), `PATCH /users/profile` on Save

### 1.4.6 Navigation Type Updates Required

```typescript
export type MainTabParamList = {
  Discover: undefined;
  Conversations: undefined;
  Gallery: undefined;           // NEW
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Chat: { conversationId: string; characterName?: string };
  CharacterDetail: { characterId: string };
  VideoCall: { conversationId: string; characterName?: string };
  Subscription: undefined;
  EditProfile: undefined;           // NEW
  TransactionHistory: undefined;    // NEW
  Settings: undefined;              // NEW
  Search: undefined;                // NEW (modal)
  ImageViewer: { imageUrl: string; prompt?: string };  // NEW
};
```

---

## 1.5 Responsive Strategy (Web)

| Breakpoint | Sidebar Nav | Conversation List | Chat Area | Character Grid |
|---|---|---|---|---|
| < 768px | Hidden (hamburger) | Full width | Full width (push) | 2 columns |
| 768–1024px | Icon-only (60px) | 280px | Remaining | 2 columns |
| 1024px+ | Full (240px) | 320px | Remaining | 3 columns |
| 1280px+ | Full (240px) | 360px | Remaining | 4 columns |

On mobile web, chat page uses a push-navigation pattern: conversation list fills the screen, selecting one pushes a full-screen chat with back button.

---

## 1.6 UX Principles

### Loading States
Every view has three states: **Skeleton** (shimmer on initial load), **Content** (normal), **Error** (inline message + retry button).

### Empty States
- **Conversations:** "No chats yet. Discover characters to start chatting!" + CTA
- **Gallery:** "No media yet. Generate images or voice in chat!" + CTA
- **Search results:** "No characters found for 'query'. Try different terms."

### Error Handling
- **Network errors:** Bottom toast "Connection lost. Retrying..." + auto-retry
- **401:** Token refresh interceptor → if fails, redirect to login with "Session expired" toast
- **Insufficient credits:** Inline prompt "You need X more credits" + "Buy Credits" button
- **WebSocket disconnect:** Top banner "Reconnecting..." + exponential backoff

### Feedback Patterns
- **Credit changes:** Animated bounce on credit badge (mobile has `AnimatedCreditBadge`, replicate on web)
- **Image generation:** Shimmer placeholder → fade-in result in chat
- **Voice generation:** "Generating audio..." → inline audio player
- **Message streaming:** Character-by-character rendering via WebSocket chunks (exists)

### Optimistic Updates
- Send message: Immediately show user bubble before server confirmation
- Delete conversation: Immediately remove from list, restore on error
- Credit deduction: Show deducted amount immediately, reconcile on response

---

## 1.7 API Integration Map

| Page/Screen | Endpoint | Method | Trigger |
|---|---|---|---|
| Landing | `/characters` | GET | Page load (featured carousel) |
| Register | `/auth/register` | POST | Form submit |
| Login | `/auth/login` | POST | Form submit |
| Discover | `/characters?category=X&limit=20&offset=N` | GET | Page load, category change, scroll |
| Search | `/characters?search=query` | GET | Debounced input |
| Character Detail | `/characters/:id` | GET | Page load |
| Character Detail | `/conversations` | POST | "Start Chat" |
| Conversations List | `/conversations?limit=20&offset=N` | GET | Tab focus, pull-to-refresh |
| Chat | `/conversations/:id` | GET | Conversation selected |
| Chat | WebSocket `join-conversation` | Emit | Conversation selected |
| Chat | WebSocket `send-message` | Emit | Send button |
| Chat | WebSocket `message-chunk/complete` | Listen | Streaming |
| Chat | `/media/generate/image` | POST | Attachment menu |
| Chat | `/media/generate/voice` | POST | Attachment menu |
| Profile | `/users/profile` | GET | Page load |
| Edit Profile | `/users/profile` | PATCH | Save button |
| Credits | `/users/credits` | GET | Page load |
| Credits | `/users/transactions` | GET | Page load |
| Credits | `/payments/packages` | GET | Page load |
| Gallery | `/media/generate/history` | GET | Tab focus |
| Auth check | `/auth/me` | GET | App init |
| Logout | `/auth/logout` | POST | Logout action |

---

## 1.8 New Components Required

### Web (`apps/web/src/components/`)

```
layout/
  AppShell.tsx              Sidebar nav + top bar wrapper
  SidebarNav.tsx            Persistent left nav
  TopBar.tsx                Credit badge, search, user avatar
character/
  CharacterCard.tsx         Grid card for Discover
  CharacterGrid.tsx         Responsive grid layout
  CategoryChips.tsx         Horizontal filter chips
  PersonalitySliders.tsx    Read-only personality display
  PremiumBadge.tsx          Crown/diamond for premium chars
chat/
  ConversationItem.tsx      Row in conversation list
  MessageBubble.tsx         Message with media support
  MessageComposer.tsx       Textarea + attachment menu
  AttachmentMenu.tsx        Image/voice gen options
  CharacterPickerModal.tsx  Select character for new chat
media/
  GalleryGrid.tsx           Masonry grid of generated media
  ImageLightbox.tsx         Full-screen image viewer
  AudioPlayer.tsx           Inline audio player
credits/
  CreditBadge.tsx           Animated credit display
  PackageCard.tsx           Credit package purchase card
  TransactionList.tsx       Transaction history
common/
  EmptyState.tsx            Illustration + text + CTA
  LoadingSkeleton.tsx       Shimmer placeholders
  InfiniteScroll.tsx        Intersection observer wrapper
  ConfirmDialog.tsx         Confirmation modal
```

### Mobile (`apps/mobile/src/components/`)

```
ConversationItem.tsx        Row for conversations list
CharacterInfo.tsx           Character detail content
PersonalitySlider.tsx       Single personality axis
GalleryItem.tsx             Gallery grid item
ImageViewer.tsx             Full-screen pinch-to-zoom
EmptyState.tsx              Reusable empty state
SearchBar.tsx               Search with clear button
SwipeableRow.tsx            Swipe-to-delete wrapper
```

---

# PART 2: ADMIN PANEL (Backoffice)

---

## 2.1 Architecture Decision

Build as a **new Next.js app** at `apps/admin` sharing `packages/database` and existing conventions (Next.js 14 App Router, Tailwind CSS, Zustand, TanStack React Query, Axios, Lucide icons).

**New API requirements:**
- Add `role` field to User model (`user | admin | superadmin`)
- Create `AdminModule` with `AdminGuard` in `apps/api`
- New admin-specific endpoints under `/api/admin/*`

---

## 2.2 Navigation Structure

```
┌──────────────────────────────────────────────────────────┐
│ ETHEREAL ADMIN                      [🔔] [avatar ▼]     │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│ [logo]      │ Breadcrumb: Dashboard > Characters > Edit  │
│             │                                            │
│ MAIN        │ ┌──────────────────────────────────────┐   │
│ · Dashboard │ │                                      │   │
│             │ │         PAGE CONTENT AREA             │   │
│ CONTENT     │ │                                      │   │
│ · Characters│ │                                      │   │
│ · Users     │ └──────────────────────────────────────┘   │
│ · Media     │                                            │
│             │                                            │
│ MODERATION  │                                            │
│ · Flagged   │                                            │
│ · Mod Logs  │                                            │
│             │                                            │
│ MONETIZATION│                                            │
│ · Credit Pks│                                            │
│ · Txns      │                                            │
│ · Subs      │                                            │
│             │                                            │
│ SYSTEM      │                                            │
│ · Gen Jobs  │                                            │
│ · Settings  │                                            │
├─────────────┴────────────────────────────────────────────┤
```

**Sidebar:** 240px, collapsible to 64px icon-only. Active item gets purple-600 left border + bg-purple-50. Sections have muted uppercase labels.

**Top bar:** 56px fixed. Global search (Cmd+K), notification bell, admin avatar dropdown.

**Breadcrumbs:** Auto-generated from route segments.

---

## 2.3 Dashboard `/dashboard`

```
┌──────────────────────────────────────────────────────────┐
│ Dashboard                            [date range picker] │
├──────────────────────────────────────────────────────────┤
│ [Total Users] [Active Today] [Revenue MTD] [Gen Jobs 24h]│
│   12,847         1,203          $8,420         3,891     │
│  +3.2% ▲        -1.1% ▼        +12% ▲        +5.4% ▲   │
├──────────────────────┬───────────────────────────────────┤
│ Activity Chart       │ Top Characters                    │
│ [7d] [30d] [90d]    │ 1. Luna — 4.2K convos             │
│                      │ 2. Atlas — 3.1K                   │
│     ~~chart~~        │ 3. Aria — 2.8K                    │
│                      │ [View All →]                      │
├──────────────────────┼───────────────────────────────────┤
│ Recent Mod Flags     │ System Health                     │
│ · msg-xxx (violence) │ API: OK (42ms)                    │
│ · img-xxx (nsfw)     │ DB: OK (3ms)                      │
│ [View All →]         │ fal.ai: OK                        │
└──────────────────────┴───────────────────────────────────┘
```

**API:** `GET /api/admin/stats` (new aggregate endpoint, 30s refetch)

---

## 2.4 Character List `/characters`

```
┌──────────────────────────────────────────────────────────┐
│ Characters                         [+ Create Character]  │
├──────────────────────────────────────────────────────────┤
│ [Search___________] [Category ▼] [Status ▼] [Sort ▼]   │
│ [x] Selected: 3  [Bulk: Publish] [Bulk: Delete] [Export] │
├──────────────────────────────────────────────────────────┤
│ [x] │ Avatar │ Name/Display │ Category │ Status │ Stats │
├─────┼────────┼──────────────┼──────────┼────────┼───────┤
│ [ ] │ [img]  │ Luna         │ romance  │ Public │ 4.2K  │
│     │        │ @luna_ai     │ fantasy  │ Premium│ 4.8★  │
├─────┼────────┼──────────────┼──────────┼────────┼───────┤
│ [ ] │ [img]  │ Atlas        │ mentor   │ Draft  │ 3.1K  │
│     │        │ @atlas_wise  │ edu      │        │ 4.5★  │
├──────────────────────────────────────────────────────────┤
│ Showing 1-20 of 347           [◀ 1 2 3 ... 18 ▶]       │
└──────────────────────────────────────────────────────────┘
```

**Features:**
- **Search:** Debounced 300ms, searches name + displayName
- **Filters:** Category (multi-select), Status (all/public/draft/premium), Sort (newest/oldest/most convos/highest rated)
- **Filter state** stored in URL params for shareable links
- **Bulk actions:** Publish/Unpublish (`PATCH` each), Delete (confirmation modal), Export (client-side CSV)
- **Row actions** (three-dot menu): View Detail, Edit, Duplicate, Toggle Public, Delete
- **Row click** → navigates to detail view

**API:** `GET /api/admin/characters?search=X&category=Y&status=Z&sort=W&page=N&limit=20`

---

## 2.5 Character Creation/Edit Form (PRIMARY ADMIN TASK)

**Route:** `/characters/new` (create), `/characters/:id/edit` (edit)

### Form Architecture: Single Page with Sticky Section Navigator

```
┌──────────────────────────────────────────────────────────┐
│ [← Back] Create Character          [Save Draft] [Publish]│
├──────────────┬───────────────────────────────────────────┤
│ SECTIONS     │ FORM CONTENT                              │
│              │                                           │
│ · Basic Info │ ┌─ BASIC INFORMATION ─────────────────┐   │
│ · Personality│ │ Name*          [__________________]  │   │
│ · Voice      │ │ Display Name*  [__________________]  │   │
│ · Media      │ │ Description*   [__________________]  │   │
│ · LoRA Config│ │                [__________________]  │   │
│ · Discovery  │ │ System Prompt*                       │   │
│              │ │ [                               ]    │   │
│              │ │ [    (monospace textarea with    ]    │   │
│              │ │ [     line numbers)              ]    │   │
│              │ │ [                               ]    │   │
│              │ │ Char count: 1,240 / 10,000          │   │
│              │ └─────────────────────────────────────┘   │
│              │                                           │
│              │ ┌─ PERSONALITY SLIDERS ────────────────┐   │
│              │ │ Shy ────[════○══════]──── Bold       │   │
│              │ │ 0            42           100        │   │
│              │ │                                      │   │
│              │ │ Romantic ─[═○═════════]── Pragmatic  │   │
│              │ │ 0         18             100         │   │
│              │ │                                      │   │
│              │ │ Playful ─[════════○══]─── Serious    │   │
│              │ │ 0              78        100         │   │
│              │ │                                      │   │
│              │ │ Dominant [═════○═════]─── Submissive │   │
│              │ │ 0          50            100         │   │
│              │ │                                      │   │
│              │ │ Preview: "This character is          │   │
│              │ │ moderately shy, very romantic,       │   │
│              │ │ quite serious, and balanced."        │   │
│              │ └─────────────────────────────────────┘   │
│              │                                           │
│              │ ┌─ VOICE CONFIGURATION ────────────────┐   │
│              │ │ Provider   [elevenlabs ▼]            │   │
│              │ │ Voice      [Search voices... ▼]      │   │
│              │ │            [▶ Play Sample]           │   │
│              │ └─────────────────────────────────────┘   │
│              │                                           │
│              │ ┌─ MEDIA ─────────────────────────────┐   │
│              │ │ Profile Image                        │   │
│              │ │ ┌─────────┐  [Generate with AI]     │   │
│              │ │ │ drag &  │  [Upload from file]     │   │
│              │ │ │  drop   │                         │   │
│              │ │ └─────────┘                         │   │
│              │ │                                      │   │
│              │ │ Gallery (drag to reorder)            │   │
│              │ │ [img1] [img2] [img3] [+ Add]        │   │
│              │ │                                      │   │
│              │ │ Video (Idle)     [Upload / URL]      │   │
│              │ │ Video (Speaking) [Upload / URL]      │   │
│              │ └─────────────────────────────────────┘   │
│              │                                           │
│              │ ┌─ LORA MODEL CONFIGURATION ───────────┐   │
│              │ │ [+ Add LoRA Model]                    │   │
│              │ │ ┌────────────────────────────────┐    │   │
│              │ │ │ Model Name:  [____________]    │    │   │
│              │ │ │ Model URL:   [____________]    │    │   │
│              │ │ │ Weight:      [════○═══] 0.8    │    │   │
│              │ │ │ Triggers: [tag1] [tag2] [+]    │    │   │
│              │ │ │ Based On:    [SDXL ▼]          │    │   │
│              │ │ │ Training Steps: [1500]          │    │   │
│              │ │ │ Training Images:                │    │   │
│              │ │ │ [img] [img] [img] [+ Upload]   │    │   │
│              │ │ │ [x] Active                     │    │   │
│              │ │ │ [Delete LoRA]                   │    │   │
│              │ │ └────────────────────────────────┘    │   │
│              │ └─────────────────────────────────────┘   │
│              │                                           │
│              │ ┌─ DISCOVERY & ACCESS ─────────────────┐   │
│              │ │ Categories* (1-3 required)            │   │
│              │ │ [romance] [fantasy] [+ ▼]            │   │
│              │ │                                      │   │
│              │ │ Tags (free-form, max 10)              │   │
│              │ │ [cute] [anime] [+___________]        │   │
│              │ │                                      │   │
│              │ │ [x] Public  [ ] Premium  [ ] Official│   │
│              │ └─────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────┘
```

### Field Validation Rules

| Field | Type | Required | Validation | Error Message |
|---|---|---|---|---|
| `name` | text | Yes | 2-50 chars, alphanumeric+underscore, unique | "Name must be 2-50 characters, alphanumeric only" |
| `displayName` | text | Yes | 2-100 chars | "Display name is required (2-100 chars)" |
| `description` | textarea | Yes | 10-500 chars | "Description must be 10-500 characters" |
| `systemPrompt` | textarea | Yes | 50-10,000 chars | "System prompt must be at least 50 characters" |
| `shynessBold` | slider | No | 0-100 integer | (slider prevents invalid) |
| `romanticPragmatic` | slider | No | 0-100 integer | (slider prevents invalid) |
| `playfulSerious` | slider | No | 0-100 integer | (slider prevents invalid) |
| `dominantSubmissive` | slider | No | 0-100 integer | (slider prevents invalid) |
| `voiceProvider` | select | No | elevenlabs \| azure \| google | (dropdown prevents invalid) |
| `voiceId` | searchable select | Conditional (required if voiceProvider set) | valid voice from API | "Please select a voice" |
| `category` | multi-select | Yes (≥1) | 1-3 from enum | "Select 1-3 categories" |
| `tags` | tag input | No | each 2-30 chars, max 10 | "Tag too long" / "Max 10 tags" |
| `isPublic` | checkbox | No | boolean | — |
| `isPremium` | checkbox | No | boolean | — |
| `isOfficial` | checkbox | No | boolean (superadmin only) | — |
| media.profile | file/url | No | image, max 5MB, jpg/png/webp | "Image must be under 5MB" |
| lora.weight | slider | No | 0.0-1.0, step 0.05 | (slider prevents invalid) |
| lora.modelUrl | url | Conditional | valid URL format | "Enter a valid model URL" |
| lora.triggerWords | tag input | Conditional | ≥1 if LoRA added | "Add at least one trigger word" |

### Form Behavior & UX

**Validation strategy:** Validate on blur for individual fields. Full validation on submit. Inline errors below each field (red-500). Section navigator shows red dot on sections with errors.

**Auto-save draft:** Every 30 seconds to `localStorage`. "Draft saved" subtle toast. On page load, check for draft → offer restore.

**Save/Publish workflow:**
- **"Save Draft"** → `POST /api/characters` with `{ isPublic: false }` or `PATCH /api/characters/:id`. Success toast. Stays on page.
- **"Publish"** → Full validation → save with `{ isPublic: true }`. Success toast → navigate to detail page.
- If editing already-public character → button reads "Update" instead of "Publish".

**Personality Preview:** Below sliders, auto-generated text: 0-20="very [left]", 21-40="somewhat [left]", 41-60="balanced", 61-80="somewhat [right]", 81-100="very [right]". Updates in real-time.

**Voice section:** When provider selected, voice dropdown populated via `GET /api/media/voices`. "Play Sample" plays audio clip.

**Media section:** Profile image: drag-drop or AI generation (opens prompt modal → `POST /media/generate/image`). Gallery: sortable via drag-and-drop (updates `order`). Delete with confirmation.

**Keyboard shortcuts:** `Cmd+S` = Save draft, `Cmd+Enter` = Publish, `Escape` = Back (with unsaved changes confirmation).

**Form technology:** `react-hook-form` + `zod` resolver. TanStack React Query `useMutation` for API calls with cache invalidation.

### Component Hierarchy

```
CharacterFormPage
  PageHeader (back, title, Save Draft, Publish)
  SectionNavigator (sticky, scrollspy-linked, error dots)
  FormProvider (react-hook-form)
    BasicInfoSection
      TextInput (name) — validates uniqueness on blur
      TextInput (displayName)
      TextArea (description)
      SystemPromptEditor (monospace textarea + char count)
    PersonalitySection
      PersonalitySlider × 4 (left/right labels, value display)
      PersonalityPreview (computed natural language text)
    VoiceSection
      Select (voiceProvider)
      SearchableSelect (voiceId, from API)
      AudioPlayer (sample)
    MediaSection
      ProfileImageUploader (drag-drop + AI generate modal)
      GalleryManager (sortable grid + upload + delete)
      VideoUploader (idle)
      VideoUploader (speaking)
    LoRASection (collapsible, repeatable)
      LoRAModelCard
        TextInput (name, modelUrl, basedOn)
        Slider (weight, 0-1, step 0.05)
        TagInput (triggerWords)
        NumberInput (trainingSteps)
        ImageUploadGrid (trainingImages, batch upload)
        Checkbox (isActive)
        DeleteButton
    DiscoverySection
      MultiSelect (category, from enum list)
      TagInput (tags, free-form)
      Checkbox (isPublic)
      Checkbox (isPremium)
      Checkbox (isOfficial — superadmin only, hidden otherwise)
```

---

## 2.6 Character Detail (Admin View) `/characters/:id`

```
┌──────────────────────────────────────────────────────────┐
│ [← Characters] Luna                    [Edit] [Delete]   │
├──────────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────────────────────────────┐   │
│ │            │  │ Display Name: Luna                  │   │
│ │ [Profile]  │  │ Name: luna_ai                       │   │
│ │            │  │ Creator: @admin (Official)           │   │
│ │            │  │ Created: 2024-12-15                  │   │
│ └────────────┘  │ Status: Public | Premium | Official  │   │
│                  └────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│ [Convos: 4,203] [Messages: 28,491] [Rating: 4.8] [Imgs: 892]│
├──────────────────────────────────────────────────────────┤
│ TABS: [Description] [System Prompt] [Personality] [Media]│
│                                                          │
│ (Description tab shown by default)                       │
│ "Luna is a gentle and romantic AI companion..."          │
│ Categories: [romance] [fantasy]                          │
│ Tags: [cute] [anime] [gentle]                            │
├──────────────────────────────────────────────────────────┤
│ 30-Day Metrics Chart (from CharacterStats)               │
│ [daily conversations + messages line chart]               │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET /api/characters/:id` (with media, loraModels, creator relations)

---

## 2.7 User Management `/users`

### User List

```
┌──────────────────────────────────────────────────────────┐
│ Users                                     [Export CSV]    │
├──────────────────────────────────────────────────────────┤
│ [Search___________] [Status ▼] [Premium ▼] [Sort ▼]    │
├────────┬────────────────────┬─────────┬─────────┬────────┤
│ Avatar │ Username/Email     │ Credits │ Premium │ Joined │
├────────┼────────────────────┼─────────┼─────────┼────────┤
│ [img]  │ alice              │ 450     │ Yes     │ Dec 12 │
│        │ alice@example.com  │         │ Jan 15  │        │
├────────┼────────────────────┼─────────┼─────────┼────────┤
│ [img]  │ bob_smith          │ 12      │ No      │ Jan 01 │
│        │ bob@example.com    │         │         │        │
└────────┴────────────────────┴─────────┴─────────┴────────┘
```

### User Detail (slide-over or separate page)

```
┌──────────────────────────────────────────────────────────┐
│ User: alice                           [Suspend] [Edit]   │
├──────────────────────────────────────────────────────────┤
│ Profile Info          │ Account Status                   │
│ Email: alice@...      │ Active: Yes                      │
│ Username: alice       │ Verified: Yes                    │
│ Joined: Dec 12, 2024  │ Premium: Yes (until Mar 15)      │
│ Last Login: 2h ago    │ Credits: 450                     │
├──────────────────────────────────────────────────────────┤
│ ACTIONS                                                  │
│ [Add Credits: [___] [Add]]  [Reset Password]            │
│ [Toggle Premium]  [Toggle Active]  [Toggle Verified]    │
├──────────────────────────────────────────────────────────┤
│ Recent Activity (UserActivity, last 20)                  │
│ · 2h ago: message_sent (conv-xxx)                       │
│ · 3h ago: image_generated (char-xxx)                    │
│ · 1d ago: login                                         │
├──────────────────────────────────────────────────────────┤
│ Transactions (last 10)                                   │
│ · Jan 3: SPEND -10 (image gen) bal: 450                 │
│ · Jan 2: PURCHASE +500 ($4.99) bal: 460                 │
├──────────────────────────────────────────────────────────┤
│ Characters Created │ Subscriptions                       │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET/PATCH /api/admin/users/:id`

---

## 2.8 Content Moderation `/moderation`

```
┌──────────────────────────────────────────────────────────┐
│ Content Moderation                [Pending: 23] [All]    │
├──────────────────────────────────────────────────────────┤
│ Filters: [Type ▼] [Category ▼] [Confidence ▼] [Date ▼] │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐   │
│ │ FLAG #mod-xxx                       2 hours ago    │   │
│ │ Type: message │ Violation: sexual │ Conf: 0.92    │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ CONTENT PREVIEW:                                   │   │
│ │ "The flagged message content with problematic      │   │
│ │  portions highlighted in yellow..."                │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ Context: User @alice → character Luna              │   │
│ │ [Expand to view surrounding messages]              │   │
│ ├────────────────────────────────────────────────────┤   │
│ │ [Approve] [Confirm & Block] [Dismiss] [Ban User]  │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ FLAG #mod-yyy                       5 hours ago    │   │
│ │ Type: image │ Violation: violence │ Conf: 0.78    │   │
│ │ ...                                                │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Actions:** Approve → `action='allowed'`, Block → `action='blocked'` + hide content, Ban → navigate to user suspend.

**Keyboard workflow:** `A`=approve, `B`=block, `D`=dismiss, `J/K`=next/prev card. Priority sorted by confidence (highest first).

---

## 2.9 Admin Error Handling & Feedback

| Scenario | UI Treatment |
|---|---|
| API request in flight | Button spinner + disabled. Tables show skeletons. |
| Successful mutation | Green toast, auto-dismiss 3s. "Character saved successfully" |
| Validation error (client) | Inline red text below field. Section nav red dot. |
| API 400 | Toast with error. Field errors mapped to form. |
| API 401/403 | Redirect to admin login. Clear auth. |
| API 404 | Full-page "Not Found" + back link. |
| API 500 | Red toast "Something went wrong" + retry. |
| Network error | Persistent red banner "Connection lost" + auto-retry. |
| Destructive action | Confirmation modal: "Delete [name]? This cannot be undone." |
| Unsaved changes | `beforeunload` + custom modal on internal nav. |
| Empty state | Illustration + "No characters found" + CTA. |
| Loading (initial) | Full skeleton matching page layout. |

---

## 2.10 New Admin API Endpoints Required

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard aggregate stats |
| GET | `/api/admin/users` | Paginated user list with filters |
| GET | `/api/admin/users/:id` | Full user detail with relations |
| PATCH | `/api/admin/users/:id` | Update user (credits, status) |
| GET | `/api/admin/characters` | All characters (not just public) |
| GET | `/api/admin/moderation` | Moderation queue with filters |
| PATCH | `/api/admin/moderation/:id` | Review moderation flag |
| GET | `/api/admin/transactions` | All transactions |
| GET | `/api/admin/subscriptions` | All subscriptions |
| GET | `/api/admin/generation-jobs` | All generation jobs |
| GET/POST/PATCH | `/api/admin/credit-packages` | Manage credit packages |

All protected by `AdminGuard` checking `user.role === 'admin' || 'superadmin'`.

---

## 2.11 Admin Tech Stack

| Concern | Library | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Matches `apps/web` |
| Styling | Tailwind CSS | Existing convention |
| Forms | react-hook-form + zod | Best for complex forms |
| Server state | @tanstack/react-query | Already in monorepo |
| HTTP | axios | Already configured |
| Charts | recharts | Lightweight, React-native |
| Icons | lucide-react | Already used |
| Client state | zustand | Already used |
| Drag-and-drop | @dnd-kit/core | Gallery reordering |
| Table | @tanstack/react-table | Headless, Tailwind-friendly |
| Toast | sonner | Tiny, zero config |

---

## 2.12 Critical Files for Implementation

### Existing files to reference/modify:
- `packages/database/prisma/schema.prisma` — Must add `role` field to User; reference for all entity shapes
- `apps/api/src/modules/characters/characters.controller.ts` — Reference for character API patterns
- `apps/api/src/modules/characters/dto/create-character.dto.ts` — All character fields and validation
- `apps/api/src/app.module.ts` — Register new AdminModule
- `apps/web/src/lib/api-client.ts` — Axios pattern to replicate in admin app
- `apps/mobile/src/navigation/types.ts` — Navigation types needing new entries

### New files to create:
- `apps/admin/` — Entire new Next.js admin application
- `apps/api/src/modules/admin/` — Admin module with guard, controller, service

---

## Implementation Sequencing

### Phase 1: User Interface Foundation
1. Create `AppShell` layout for web (sidebar + topbar)
2. Add web routes: `/discover`, `/characters/:id`, `/profile`, `/credits`, `/gallery`
3. Implement mobile `ConversationsScreen` (replace stub)
4. Implement mobile `CharacterDetailScreen` (replace stub)
5. Add Gallery tab to mobile bottom nav

### Phase 2: Character Discovery & Detail
6. Build web Discover page with grid + category filtering
7. Build web Character Detail page
8. Build mobile Character Detail with full content
9. Implement search on both platforms

### Phase 3: Chat Redesign
10. Refactor web chat for consistent dark theme
11. Add attachment menu (image/voice gen)
12. Add inline media in message bubbles
13. Fix "New Chat" flow with character picker modal

### Phase 4: Profile & Credits
14. Build web Profile + Credits pages
15. Build mobile EditProfile + TransactionHistory screens
16. Add animated credit badge to web

### Phase 5: Media Gallery
17. Build web Gallery with masonry grid
18. Build mobile Gallery tab
19. Add ImageLightbox / ImageViewer

### Phase 6: Admin Foundation
20. Add `role` to User model, run migration
21. Create `apps/admin` Next.js app
22. Build admin layout (sidebar, topbar, breadcrumbs)
23. Create admin auth + AdminGuard in API

### Phase 7: Admin Character Management
24. Build admin character list (filters, search, pagination, bulk actions)
25. Build character creation/edit form (all sections)
26. Build character detail view with stats

### Phase 8: Admin Users & Moderation
27. Build user list + detail pages
28. Build moderation queue

### Phase 9: Admin Dashboard & Polish
29. Build dashboard with charts
30. Add monetization pages
31. Polish all pages (skeletons, empty states, keyboard shortcuts)
