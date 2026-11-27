/**
 * Spacing scale for padding, margin and gap, in density independent pixels.
 *
 * Tokens are named by step on the scale, not by value, so the scale can be
 * retuned (for example for tablets) without renaming every use. `md` is the
 * default gap between related elements. There is no zero token: write `0`.
 */
export const spacing = {
  '3xs': 2,
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;
