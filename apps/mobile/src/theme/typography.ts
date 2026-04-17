import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375;

export const fontSize = {
  displayXL: Math.round(34 * scale),
  displayL:  Math.round(28 * scale),
  displayM:  Math.round(24 * scale),
  bodyL:     17,
  bodyM:     15,
  bodyS:     13,
  caption:   11,
  micro:     9,
};

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  black:    '900' as const,
};

export const lineHeight = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.65,
};

export const fontFamily = Platform.select({
  ios: { display: 'System', body: 'System' },
  android: { display: 'sans-serif', body: 'sans-serif' },
  default: { display: 'System', body: 'System' },
})!;
