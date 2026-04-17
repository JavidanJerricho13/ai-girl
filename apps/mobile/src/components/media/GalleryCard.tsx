import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { usePressAnimation } from '../../hooks/usePressAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 8;
const PAD = 20;
const CARD_WIDTH = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

// Default lilac-tinted blurhash for loading state
const DEFAULT_BLURHASH = 'L6Pj0^jE.mfR~WfQt7j@_3j@WBWB';

interface GalleryCardProps {
  item: {
    id: string;
    type: string;
    resultUrl: string | null;
    prompt: string | null;
    createdAt: string;
    blurDataUrl?: string;
  };
  height?: number;
  onPress: () => void;
}

export function GalleryCard({ item, height, onPress }: GalleryCardProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation(1, 0.96);
  const cardHeight = height || CARD_WIDTH * 1.2;
  const isVoice = item.type === 'voice';

  if (isVoice) {
    return (
      <Animated.View style={[styles.voiceCard, { width: CARD_WIDTH }, animatedStyle]}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          style={styles.voiceInner}
        >
          <View style={styles.voiceIcon}>
            <Text style={styles.voiceEmoji}>🎙</Text>
          </View>
          <Text style={styles.voiceLabel}>Voice</Text>
          {item.prompt && (
            <Text style={styles.voicePrompt} numberOfLines={2}>{item.prompt}</Text>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.imageCard, { width: CARD_WIDTH, height: cardHeight }, animatedStyle]}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={StyleSheet.absoluteFill}
      >
        <Image
          source={item.resultUrl}
          placeholder={item.blurDataUrl || DEFAULT_BLURHASH}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  voiceCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
  },
  voiceInner: {
    alignItems: 'center',
    gap: 8,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceEmoji: {
    fontSize: 22,
  },
  voiceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FBBF24',
  },
  voicePrompt: {
    fontSize: 11,
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export { CARD_WIDTH, GAP, PAD };
