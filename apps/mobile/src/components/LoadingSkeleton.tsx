import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width: w = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const translateX = useSharedValue(-width);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: w,
          height,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function CharacterCardSkeleton() {
  const cardWidth = (width - 48) / 2;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <Skeleton width={cardWidth} height={240} borderRadius={16} />
    </View>
  );
}

export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}>
      {!isUser && <Skeleton width={32} height={32} borderRadius={16} style={styles.avatar} />}
      <View style={styles.messageBubble}>
        <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} />
      </View>
    </View>
  );
}

export function ConversationItemSkeleton() {
  return (
    <View style={styles.conversationItem}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.conversationContent}>
        <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1F2937',
  },
  card: {
    marginRight: 16,
    marginBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  conversationContent: {
    flex: 1,
  },
});
