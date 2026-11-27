/**
 * Raw colour values. Components should not import this file: use the
 * semantic names in `colors.ts`, which say what a colour is for. Add a raw
 * value here only when a new semantic token needs it.
 */
export const palette = {
  black: '#000000',
  /** Black at 73% opacity. */
  blackAlpha73: '#000000bb',
  /** Black at 80% opacity. */
  blackAlpha80: '#000000cc',
  blue500: '#3a7ad9',
  brown400: '#8a5a2b',
  brown900: '#3b2a20',
  charcoal: '#2b2b2b',
  gold400: '#e0b23f',
  grey500: '#9c9c97',
  ice100: '#bed7f2',
  ice200: '#aecbee',
  ice300: '#9ebfe9',
  ice400: '#8fb4e5',
  navy700: '#2e3a55',
  red500: '#d8452f',
  slate500: '#5a6070',
  slate800: '#2a2f3a',
  slate950: '#14171f',
  teal400: '#35c9c4',
  transparent: 'transparent',
  white: '#ffffff',
} as const;
