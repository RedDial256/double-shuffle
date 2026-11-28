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
  /** Black at 25% opacity. */
  blackAlpha25: '#00000040',
  blue500: '#3a7ad9',
  brown400: '#8a5a2b',
  brown900: '#3b2a20',
  charcoal: '#2b2b2b',
  coral300: '#ff9b7a',
  gold200: '#f5d76e',
  gold400: '#e0b23f',
  grey500: '#9c9c97',
  frost50: '#f4faff',
  ice100: '#bed7f2',
  ice200: '#aecbee',
  ice300: '#9ebfe9',
  ice400: '#8fb4e5',
  red500: '#d8452f',
  sky500: '#3f93d4',
  slate300: '#9aa3b5',
  slate500: '#5a6070',
  slate800: '#2a2f3a',
  slate950: '#14171f',
  /** slate950 at 93% opacity. */
  slate950Alpha93: '#14171fee',
  teal400: '#35c9c4',
  transparent: 'transparent',
  white: '#ffffff',
} as const;
