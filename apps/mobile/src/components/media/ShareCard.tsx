import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { haptic } from '../../utils/haptics';

interface ShareCardProps {
  imageUrl: string;
  characterName: string;
  characterId: string;
  prompt?: string;
}

export function ShareCard({ imageUrl, characterName, characterId, prompt }: ShareCardProps) {
  const handleShare = useCallback(async () => {
    haptic.light();
    try {
      await Share.share({
        title: `${characterName} on Ethereal`,
        message: prompt
          ? `"${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}" — ${characterName}\n\nhttps://ethereal.app/c/${characterId}`
          : `Check out ${characterName} on Ethereal\nhttps://ethereal.app/c/${characterId}`,
        url: imageUrl,
      });
      haptic.success();
    } catch {
      // User cancelled share
    }
  }, [imageUrl, characterName, characterId, prompt]);

  return (
    <TouchableOpacity onPress={handleShare} activeOpacity={0.9}>
      <View style={styles.card}>
        <Image
          source={imageUrl}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.overlay}>
          {prompt && (
            <Text style={styles.quoteText} numberOfLines={3}>
              "{prompt}"
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.characterName}>{characterName}</Text>
            <Text style={styles.brand}>Ethereal</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0A0B1E',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
  },
  quoteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterName: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '500',
  },
  brand: {
    color: '#8B7FFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
