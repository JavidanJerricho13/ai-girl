import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/chat/ChatScreen';
import CharacterDetailScreen from '../screens/character/CharacterDetailScreen';
import VideoCallScreen from '../screens/video/VideoCallScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';

const Stack = createStackNavigator<MainStackParamList>();

export function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
}
