import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptic = {
  /** Light tap — send message, open card, minor action */
  light: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium tap — pull-to-refresh, swipe action */
  medium: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy tap — long press, destructive action */
  heavy: () => isNative && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success — purchase complete, reward claimed, image generated */
  success: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error — failed action, validation error */
  error: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Warning — low credits, destructive confirmation */
  warning: () => isNative && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Selection tick — tab switch, picker change */
  select: () => isNative && Haptics.selectionAsync(),
};
