/** Font sizes in density independent pixels. */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  /** Headline moments, such as the winner announcement. */
  display: 36,
} as const;

/** Font weights, as the strings React Native expects. */
export const fontWeight = {
  regular: '400',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;
