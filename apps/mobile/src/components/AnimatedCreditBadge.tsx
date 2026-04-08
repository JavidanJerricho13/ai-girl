import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '../store/auth.store';

interface AnimatedCreditBadgeProps {
  onPress?: () => void;
}

export function AnimatedCreditBadge({ onPress }: AnimatedCreditBadgeProps) {
  const { user } = useAuthStore();
  const scale = useSharedValue(1);
  const prevCredits = useSharedValue(user?.credits || 0);

  useEffect(() => {
    if (user?.credits && user.credits !== prevCredits.value) {
      // Animate when credits change
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      prevCredits.value = user.credits;
    }
  }, [user?.credits]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!user) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.badge, animatedStyle]}>
        <Text style={styles.icon}>💎</Text>
        <Text style={styles.credits}>{user.credits.toLocaleString()}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  credits: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
