import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(View);

interface GlassInputProps extends TextInputProps {
  icon?: React.ReactNode;
}

export function GlassInput({ icon, style, ...props }: GlassInputProps) {
  const borderOpacity = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: `rgba(139, 127, 255, ${0.08 + borderOpacity.value * 0.22})`,
  }));

  return (
    <AnimatedView style={[styles.container, animatedBorder, style]}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <TextInput
        placeholderTextColor="#52525B"
        onFocus={() => { borderOpacity.value = withTiming(1, { duration: 200 }); }}
        onBlur={() => { borderOpacity.value = withTiming(0, { duration: 200 }); }}
        {...props}
        style={[styles.input, !icon && { paddingLeft: 16 }]}
      />
    </AnimatedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    height: 44,
  },
  iconWrapper: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#F5F3FF',
    paddingHorizontal: 12,
    height: '100%',
  },
});
