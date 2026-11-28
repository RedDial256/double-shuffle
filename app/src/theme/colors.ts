import { palette } from './palette';

/** Semantic colour tokens. Name a token after its role, not its hue. */
export const colors = {
  /** Primary action, such as a button fill. */
  accent: palette.teal400,
  background: palette.slate950,
  /** Board drawing on the Skia canvas. */
  board: {
    /** Flash on a cube a wind blast just hit, and the core of a charge. */
    blastFlash: palette.white,
    dispenser: palette.brown900,
    divider: palette.grey500,
    ice: palette.ice100,
    /** Scoring bands from the outermost (shallowest) band inwards. */
    iceBands: [palette.ice200, palette.ice300, palette.ice400],
    /** Dot on a cube that a wind charge has knocked back. */
    knockedMarker: palette.charcoal,
    platform: palette.brown400,
    /** Ring around a cube that scored, during the round summary. */
    scoredRing: palette.gold200,
    startLine: palette.teal400,
    wall: palette.gold400,
    /** Body of a wind charge and its burst: pale, like a ball of wind. */
    windCharge: palette.frost50,
    /** Swirl lines on a wind charge and the ring of its blast. */
    windSwirl: palette.sky500,
  },
  border: {
    /** Edge of a card that marks a key moment, such as the round summary. */
    highlight: palette.gold200,
    subtle: palette.slate500,
  },
  /** Fill of an unlit score light. */
  indicatorOff: palette.slate800,
  /** Dims the game behind a modal overlay. */
  scrim: palette.blackAlpha73,
  /** Background of a toast message. */
  scrimStrong: palette.blackAlpha80,
  /** Background of a card over the board, such as the round summary. */
  surface: palette.slate950Alpha93,
  /** Team colours, indexed by team (0 = red, 1 = blue). */
  team: [palette.red500, palette.blue500],
  text: {
    /** Text on an `accent` fill. */
    onAccent: palette.black,
    primary: palette.white,
    /** Less important text: round number, totals. */
    secondary: palette.slate300,
    /** Something that cost points, such as a windburst penalty. */
    penalty: palette.coral300,
  },
  transparent: palette.transparent,
} as const;
