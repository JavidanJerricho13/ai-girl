# Ethereal Mobile App

React Native mobile application built with Expo for the Ethereal AI Companion Platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📱 Features

- **Authentication**: Email/password login and registration
- **Character Discovery**: Browse and discover AI characters
- **Real-time Chat**: Streaming chat with WebSocket support
- **Media Support**: Image viewing and audio playback
- **Video Calls**: Real-time video chat with AI characters
- **In-App Purchases**: Credit packages via RevenueCat
- **Premium Subscriptions**: Subscription management

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **API Client**: Axios
- **Real-time**: Socket.io
- **Payments**: RevenueCat
- **Animations**: React Native Reanimated

## 📂 Project Structure

```
apps/mobile/
├── src/
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, Register
│   │   ├── main/         # Discover, Conversations, Profile
│   │   ├── chat/         # Chat screen
│   │   ├── character/    # Character details
│   │   ├── video/        # Video call
│   │   └── subscription/ # Subscription & purchases
│   ├── services/         # API and WebSocket services
│   ├── store/            # Zustand stores
│   └── components/       # Reusable components
├── App.tsx               # App entry point
└── package.json
```

## 🔑 Environment Variables

Create a `.env` file based on `.env.example`:

```bash
API_URL=http://localhost:3001/api
REVENUECAT_API_KEY_IOS=your_ios_key
REVENUECAT_API_KEY_ANDROID=your_android_key
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 Building

```bash
# Build for development
eas build --profile development --platform ios
eas build --profile development --platform android

# Build for production
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 🚢 Deployment

### iOS (App Store)

1. Configure app signing in Xcode
2. Build with `eas build --profile production --platform ios`
3. Submit with `eas submit --platform ios`

### Android (Google Play)

1. Generate signing keys
2. Build with `eas build --profile production --platform android`
3. Submit with `eas submit --platform android`

## 📝 License

Proprietary - All rights reserved
