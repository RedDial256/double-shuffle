import { palette } from './palette';

/** Semantic colour tokens. Name a token after its role, not its hue. */
export const colors = {
  /** Primary action, such as a button fill. */
  accent: palette.teal400,
  background: palette.slate950,
  /** Board drawing on the Skia canvas. */
  board: {
    dispenser: palette.brown900,
    divider: palette.grey500,
    ice: palette.ice100,
    /** Scoring bands from the outermost (shallowest) band inwards. */
    iceBands: [palette.ice200, palette.ice300, palette.ice400],
    /** Dot on a cube that a wind charge has knocked back. */
    knockedMarker: palette.charcoal,
    platform: palette.brown400,
    startLine: palette.teal400,
    wall: palette.gold400,
    windCharge: palette.navy700,
  },
  border: {
    subtle: palette.slate500,
  },
  /** Fill of an unlit score light. */
  indicatorOff: palette.slate800,
  /** Dims the game behind a modal overlay. */
  scrim: palette.blackAlpha73,
  /** Background of a toast message. */
  scrimStrong: palette.blackAlpha80,
  /** Team colours, indexed by team (0 = red, 1 = blue). */
  team: [palette.red500, palette.blue500],
  text: {
    /** Text on an `accent` fill. */
    onAccent: palette.black,
    primary: palette.white,
  },
  transparent: palette.transparent,
} as const;
