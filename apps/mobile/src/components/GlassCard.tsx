import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
}

export function GlassCard({ children, style, accent }: GlassCardProps) {
  return (
    <View style={[accent ? styles.accent : styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  accent: {
    backgroundColor: 'rgba(139, 127, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139, 127, 255, 0.15)',
    borderRadius: 20,
  },
});
