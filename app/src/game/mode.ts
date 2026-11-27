/**
 * Per-match rules. A `GameMode` is handed to `GameEngine.startMatch()` and
 * holds everything that can differ between presets, the Custom mode and the
 * rotating modes after v1. Board geometry, colours, team names, timings and
 * the rest of the physics stay global in `config.ts` (docs/decisions.md D-18).
 */
import { px } from './config';

export interface GameMode {
  /** Stable identifier, for saving the last mode and for analytics. */
  id: string;
  name: string;

  // Match rules
  /** Total that wins the match (D-07). */
  targetScore: number;
  /** Cubes each team throws per round. */
  cubesPerRound: number;
  /** Wind charges the defender gets for each throw. */
  windChargesPerThrow: number;
  /** Swap who throws first every round (D-08). */
  alternateFirstShooter: boolean;
  /** Let match totals go below zero (D-07). */
  allowNegativeMatchScore: boolean;

  // Wind strength
  /** Blocks from ground zero that a blast reaches. */
  windBlastRadius: number;
  /** Impulse a blast gives a cube at ground zero, fading to 0 at the radius. */
  windBlastImpulse: number;
}

/** The rulebook rules: 4 cubes each, first to 15. */
export const classicMode: Readonly<GameMode> = Object.freeze({
  id: 'classic',
  name: 'Classic',
  targetScore: 15,
  cubesPerRound: 4,
  windChargesPerThrow: 2,
  alternateFirstShooter: true,
  allowNegativeMatchScore: false,
  windBlastRadius: 3,
  windBlastImpulse: px(620),
});

export const defaultMode = classicMode;
