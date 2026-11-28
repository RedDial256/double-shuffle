import type { GameMode } from '../game/mode';

export interface SpriteSlots {
  /** Cube sprites: every cube both teams can throw in a round. */
  cubes: number;
  /** Wind charge sprites, with room for a blast still fading out. */
  charges: number;
}

/**
 * How many cube and wind charge sprites the board needs for a match. The
 * board draws a fixed list of sprites from a shared frame buffer, so the list
 * must be as long as the most of each that can be on the ice at once.
 */
export function spriteSlots(mode: Readonly<GameMode>): SpriteSlots {
  return {
    cubes: mode.cubesPerRound * 2,
    charges: mode.windChargesPerThrow * 2,
  };
}
