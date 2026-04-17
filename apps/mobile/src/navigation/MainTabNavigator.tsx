import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import DiscoverScreen from '../screens/main/DiscoverScreen';
import ConversationsScreen from '../screens/main/ConversationsScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B7FFF',
        tabBarInactiveTintColor: '#52525B',
        tabBarStyle: {
          backgroundColor: 'rgba(10,11,30,0.92)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          paddingTop: 5,
          paddingBottom: 28,
          height: 88,
          position: 'absolute' as const,
        },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarLabel: 'Gallery',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component (will be replaced with proper icons)
function TabIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
  );
}
