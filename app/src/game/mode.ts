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
  // A clean hit just ahead of a cube in the scoring bands drives it back to
  // the starting line (the Round Killer); a glancing one still costs ground
  // (docs/decisions.md D-28).
  windBlastImpulse: px(2790),
});

export const defaultMode = classicMode;

/** Fewer cubes and a lower target, for a match of a few minutes. */
export const quickMode: Readonly<GameMode> = Object.freeze({
  ...classicMode,
  id: 'quick',
  name: 'Quick',
  targetScore: 9,
  cubesPerRound: 3,
});

/** More wind charges and stronger blasts: the board never stays still. */
export const chaoticMode: Readonly<GameMode> = Object.freeze({
  ...classicMode,
  id: 'chaotic',
  name: 'Chaotic',
  windChargesPerThrow: 3,
  windBlastRadius: classicMode.windBlastRadius * 1.3,
  windBlastImpulse: classicMode.windBlastImpulse * 1.4,
});

/** The presets offered before a match, in the order they are shown. */
export const presetModes: readonly Readonly<GameMode>[] = [
  quickMode,
  classicMode,
  chaoticMode,
];

/** Wind strength for the Custom mode, as multiples of Classic's blast. */
export const windStrengths = {
  gentle: { label: 'Gentle', radius: 0.8, impulse: 0.7 },
  normal: { label: 'Normal', radius: 1, impulse: 1 },
  strong: { label: 'Strong', radius: 1.3, impulse: 1.4 },
} as const;

export type WindStrength = keyof typeof windStrengths;

/** The options a player can set in the Custom mode. */
export interface CustomSettings {
  targetScore: number;
  cubesPerRound: number;
  windChargesPerThrow: number;
  windStrength: WindStrength;
}

/**
 * Safe limits for each Custom option. Beyond these the HUD runs out of room
 * (score lights, rack) or a match stops being fun (a 1-cube round, 30
 * points).
 */
export const customLimits = {
  targetScore: { min: 5, max: 20 },
  cubesPerRound: { min: 2, max: 6 },
  windChargesPerThrow: { min: 0, max: 4 },
} as const;

/** Custom starts from the rulebook rules. */
export const defaultCustomSettings: Readonly<CustomSettings> = Object.freeze({
  targetScore: classicMode.targetScore,
  cubesPerRound: classicMode.cubesPerRound,
  windChargesPerThrow: classicMode.windChargesPerThrow,
  windStrength: 'normal',
});

const clampToLimit = (
  value: number,
  limit: { min: number; max: number },
  fallback: number
) =>
  Number.isFinite(value)
    ? Math.max(limit.min, Math.min(limit.max, Math.round(value)))
    : fallback;

/**
 * Brings Custom settings within the safe limits. Also used on settings read
 * back from the device, which may be from an older version or edited.
 */
export function clampCustomSettings(
  settings: Partial<CustomSettings>
): CustomSettings {
  const defaults = defaultCustomSettings;
  return {
    targetScore: clampToLimit(
      settings.targetScore ?? defaults.targetScore,
      customLimits.targetScore,
      defaults.targetScore
    ),
    cubesPerRound: clampToLimit(
      settings.cubesPerRound ?? defaults.cubesPerRound,
      customLimits.cubesPerRound,
      defaults.cubesPerRound
    ),
    windChargesPerThrow: clampToLimit(
      settings.windChargesPerThrow ?? defaults.windChargesPerThrow,
      customLimits.windChargesPerThrow,
      defaults.windChargesPerThrow
    ),
    windStrength:
      settings.windStrength && settings.windStrength in windStrengths
        ? settings.windStrength
        : defaults.windStrength,
  };
}

/** The Custom mode for a set of options, within the safe limits. */
export function customMode(
  settings: Partial<CustomSettings>
): Readonly<GameMode> {
  const safe = clampCustomSettings(settings);
  const wind = windStrengths[safe.windStrength];
  return Object.freeze({
    ...classicMode,
    id: 'custom',
    name: 'Custom',
    targetScore: safe.targetScore,
    cubesPerRound: safe.cubesPerRound,
    windChargesPerThrow: safe.windChargesPerThrow,
    windBlastRadius: classicMode.windBlastRadius * wind.radius,
    windBlastImpulse: classicMode.windBlastImpulse * wind.impulse,
  });
}
