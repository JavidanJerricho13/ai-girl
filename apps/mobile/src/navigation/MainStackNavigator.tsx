import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from './types';
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/chat/ChatScreen';
import CharacterDetailScreen from '../screens/character/CharacterDetailScreen';
import VideoCallScreen from '../screens/video/VideoCallScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import TransactionHistoryScreen from '../screens/profile/TransactionHistoryScreen';

const Stack = createStackNavigator<MainStackParamList>();

const darkHeader = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#0A0B1E',
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTintColor: '#F5F3FF',
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 16,
  },
};

export function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0A0B1E' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CharacterDetail" component={CharacterDetailScreen} />
      <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ ...darkHeader, title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ ...darkHeader, title: 'Transaction History' }}
      />
    </Stack.Navigator>
  );
}
