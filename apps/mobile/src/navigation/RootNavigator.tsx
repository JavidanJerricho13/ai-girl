import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { linking } from './linking';
import { useAuthStore } from '../store/auth.store';
import { notificationService } from '../services/notifications.service';
import { apiService } from '../services/api.service';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, loadUser, updateCredits, user } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, []);

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
