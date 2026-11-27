import type { TextStyle } from 'react-native';

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

/**
 * The text styles the app uses. Components pick one of these instead of
 * combining `fontSize` and `fontWeight` themselves, so text stays consistent.
 * Colour is left out on purpose: set it per use with a `colors` token, since
 * the same style often appears in a team colour.
 */
export const textVariants = {
  /** Once-per-match moments: the winner, the Round Killer. */
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    lineHeight: 44,
  },
  /** Screen titles and the round summary headline. */
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    lineHeight: 32,
  },
  /** Section headings and toast messages. */
  heading: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extraBold,
    lineHeight: 24,
  },
  /** Scores and other numbers that change, with digits of equal width. */
  score: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  /** Running text, such as the rulebook. */
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  /** Button labels. */
  button: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extraBold,
    lineHeight: 20,
  },
  /** Short HUD text: team names, the turn banner, small buttons. */
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.extraBold,
    lineHeight: 20,
  },
  /** Small secondary text: round number, totals, penalties. */
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textVariants;
