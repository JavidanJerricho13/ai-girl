import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from './types';
import { QuizScreen } from '../screens/onboarding/QuizScreen';
import { MatchResultScreen } from '../screens/onboarding/MatchResultScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="MatchResult" component={MatchResultScreen} />
    </Stack.Navigator>
  );
}
