import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { linking } from './linking';
import { useAuthStore } from '../store/auth.store';
import { notificationService } from '../services/notifications.service';
import { apiService } from '../services/api.service';
import { ActivityIndicator, View } from 'react-native';
import { StatusBarConfig } from '../components/StatusBarConfig';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, loadUser, updateCredits, user } = useAuthStore();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  // Check if user needs onboarding (no conversations yet)
  useEffect(() => {
    if (!isAuthenticated) {
      setNeedsOnboarding(null);
      return;
    }
    (async () => {
      try {
        const conversations = await apiService.getConversations();
        const list = Array.isArray(conversations) ? conversations : conversations?.data ?? [];
        setNeedsOnboarding(list.length === 0);
      } catch {
        setNeedsOnboarding(false);
      }
    })();
  }, [isAuthenticated]);

  // Register push notifications after login
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.register();
    notificationService.clearBadge();
  }, [isAuthenticated]);

  // Claim daily rewards on app launch
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const [daily, bonuses] = await Promise.all([
          apiService.claimDailyReward().catch(() => null),
          apiService.claimProfileBonuses().catch(() => null),
        ]);
        const dailyAmount = daily?.granted ? daily.amount : 0;
        const bonusAmount = bonuses?.totalGranted ?? 0;
        const total = dailyAmount + bonusAmount;
        if (total > 0 && user) {
          updateCredits(user.credits + total);
        }
      } catch {}
    })();
  }, [isAuthenticated]);

  if (isLoading || (isAuthenticated && needsOnboarding === null)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0B1E' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <>
    <StatusBarConfig />
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </>
  );
}
