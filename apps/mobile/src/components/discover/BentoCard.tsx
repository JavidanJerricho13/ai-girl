import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { usePressAnimation } from '../../hooks/usePressAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const SCREEN_PAD = 20;
const AVAILABLE = SCREEN_WIDTH - SCREEN_PAD * 2;
const SMALL_SIZE = (AVAILABLE - GRID_GAP) / 2;

interface BentoCardProps {
  character: {
    id: string;
    displayName: string;
    description: string;
    conversationCount?: number;
    avgRating?: number | null;
    isPremium?: boolean;
    media?: Array<{ url: string; type: string }>;
  };
  size: 'small' | 'feature';
  onPress: () => void;
}

export function BentoCard({ character, size, onPress }: BentoCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
  const avatarUrl = character.media?.find(m => m.type === 'profile')?.url;
  const isFeature = size === 'feature';

  return (
    <Animated.View style={[
      isFeature ? styles.featureContainer : styles.smallContainer,
      animatedStyle,
    ]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={styles.pressable}
      >
        {avatarUrl ? (
          <Image
            source={avatarUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {character.displayName.charAt(0)}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        />

        {character.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PRO</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {character.displayName}
          </Text>
          {isFeature && (
            <Text style={styles.description} numberOfLines={2}>
              {character.description}
            </Text>
          )}
          {character.conversationCount != null && (
            <Text style={styles.meta}>
              {character.conversationCount.toLocaleString()} chats
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    width: SMALL_SIZE,
    height: SMALL_SIZE * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureContainer: {
    width: AVAILABLE,
    height: AVAILABLE * 0.5,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pressable: {
    flex: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8B7FFF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(146, 64, 14, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FCD34D',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F3FF',
  },
  description: {
    fontSize: 13,
    color: '#A1A1AA',
    lineHeight: 18,
    marginTop: 4,
  },
  meta: {
    fontSize: 11,
    color: '#52525B',
    marginTop: 4,
  },
});

export { SMALL_SIZE, AVAILABLE, GRID_GAP, SCREEN_PAD };
