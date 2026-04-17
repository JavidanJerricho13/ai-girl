export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined | { screen?: string; params?: any };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Quiz: undefined;
  MatchResult: { warmth: number; playfulness: number };
};

export type MainTabParamList = {
  Discover: undefined;
  Conversations: undefined;
  Gallery: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Chat: {
    conversationId: string;
    characterId?: string;
    characterName?: string;
    characterAvatar?: string;
  };
  CharacterDetail: { characterId: string };
  VideoCall: { conversationId: string };
  Subscription: undefined;
  EditProfile: undefined;
  TransactionHistory: undefined;
};
