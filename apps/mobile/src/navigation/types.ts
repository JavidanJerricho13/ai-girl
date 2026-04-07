export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Conversations: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Chat: { conversationId: string; characterId: string };
  CharacterDetail: { characterId: string };
  VideoCall: { conversationId: string };
  Subscription: undefined;
};
