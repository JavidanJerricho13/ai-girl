import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springConfig } from '@/theme';
import { haptic } from '@/utils/haptics';

export function usePressAnimation(baseScale = 1, pressedScale = 0.97) {
  const scale = useSharedValue(baseScale);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(pressedScale, springConfig.snappy);
    haptic.light();
  };

  const onPressOut = () => {
    scale.value = withSpring(baseScale, springConfig.gentle);
  };

  return { animatedStyle, onPressIn, onPressOut };
}
