import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  phase?: 'thinking' | 'typing';
}

function ThinkingSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.thinkingContainer}>
      <Animated.View style={[styles.spinner, animatedStyle]}>
        <View style={styles.spinnerArc} />
      </Animated.View>
      <Text style={styles.thinkingText}>thinking...</Text>
    </View>
  );
}

function BouncingDots() {
  const dots = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    dots.forEach((dot, i) => {
      dot.value = withRepeat(
        withDelay(
          i * 150,
          withSequence(
            withTiming(-6, { duration: 300 }),
            withTiming(0, { duration: 300 }),
          ),
        ),
        -1,
        false,
      );
    });
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {dots.map((dot, i) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: dot.value }],
          opacity: withRepeat(
            withDelay(
              i * 150,
              withSequence(
                withTiming(1, { duration: 300 }),
                withTiming(0.4, { duration: 300 }),
              ),
            ),
            -1,
            false,
          ),
        }));

        return <Animated.View key={i} style={[styles.dot, animatedStyle]} />;
      })}
    </View>
  );
}

export function TypingIndicator({ phase = 'thinking' }: TypingIndicatorProps) {
  return (
    <View style={styles.container}>
      {phase === 'thinking' ? <ThinkingSpinner /> : <BouncingDots />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
  },
  spinnerArc: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(139, 127, 255, 0.3)',
    borderTopColor: '#8B7FFF',
  },
  thinkingText: {
    color: '#71717A',
    fontSize: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 127, 255, 0.6)',
  },
});
