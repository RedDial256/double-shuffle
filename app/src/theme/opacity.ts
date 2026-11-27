/** Opacity levels for whole elements. For translucent fills use a colour token. */
export const opacity = {
  /** Something that no longer counts, such as a killed team's rack. */
  disabled: 0.3,
  /** Pushed into the background, such as cubes that did not score. */
  dimmed: 0.4,
  full: 1,
} as const;
