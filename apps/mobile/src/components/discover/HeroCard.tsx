import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolate, SharedValue } from 'react-native-reanimated';
import { haptic } from '../../utils/haptics';
import { springConfig } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;

interface HeroCardProps {
  character: {
    id: string;
    displayName: string;
    description: string;
    media?: Array<{ url: string; type: string }>;
    conversationCount?: number;
  };
  scrollY?: SharedValue<number>;
  onPress: () => void;
}

export function HeroCard({ character, scrollY, onPress }: HeroCardProps) {
  const avatarUrl = character.media?.find(m => m.type === 'profile')?.url;
  const scale = useSharedValue(1);

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    return {
      transform: [{ translateY: interpolate(scrollY.value, [0, HERO_HEIGHT], [0, HERO_HEIGHT * 0.4]) }],
    };
  });

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, pressStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98, springConfig.snappy);
          haptic.light();
        }}
        onPressOut={() => {
          scale.value = withSpring(1, springConfig.gentle);
        }}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]}>
            {avatarUrl ? (
              <Image
                source={avatarUrl}
                style={styles.image}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>
                  {character.displayName.charAt(0)}
                </Text>
              </View>
            )}
          </Animated.View>

          <LinearGradient
            colors={['transparent', 'rgba(10,11,30,0.4)', 'rgba(10,11,30,0.95)']}
            locations={[0.3, 0.6, 1]}
            style={styles.gradient}
          />

          <View style={styles.content}>
            <Text style={styles.label}>FEATURED</Text>
            <Text style={styles.name}>{character.displayName}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {character.description}
            </Text>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Tap to meet</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '120%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1033',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#8B7FFF',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B7FFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F5F3FF',
    marginBottom: 6,
  },
  description: {
    fontSize: 15,
    color: '#A1A1AA',
    lineHeight: 22,
    marginBottom: 16,
  },
  cta: {
    backgroundColor: '#8B7FFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#8B7FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A0B1E',
  },
});
