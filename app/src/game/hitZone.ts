import { config } from './config';

/**
 * Where the shuffle stick hits the cube's face, seen from behind the cube
 * (docs/decisions.md D-30). Each axis is -1, 0 or 1:
 *
 *  - column: -1 left, 0 centre, 1 right. A hit on the left sends the cube
 *    right, and a hit on the right sends it left.
 *  - row: -1 top, 0 middle, 1 bottom. A top hit drives the cube down into the
 *    ice: a "low" shot that grips (more friction, shorter, easier to judge).
 *    A bottom hit lifts it: the cube skims with little friction for a short
 *    distance, then slides as normal.
 */
export type HitAxis = -1 | 0 | 1;

export interface HitZone {
  column: HitAxis;
  row: HitAxis;
}

export const centreHit: Readonly<HitZone> = Object.freeze({
  column: 0,
  row: 0,
});

/** All nine hit zones, top row first, left to right. */
export const hitZones: readonly Readonly<HitZone>[] = ([-1, 0, 1] as const)
  .flatMap((row) =>
    ([-1, 0, 1] as const).map((column) => ({ column, row }) as HitZone)
  )
  .map((zone) => Object.freeze(zone));

export type ShotGrip = 'low' | 'standard' | 'lifted';

export interface HitShot {
  /** Turn from the aimed direction, in radians. Positive turns right (+x). */
  angle: number;
  /** Power after the hit, 0 to 1. */
  power: number;
  grip: ShotGrip;
  /** Multiplier on the ice's damping for the whole slide. */
  dampScale: number;
  /** Blocks the cube skims with almost no friction before it grips. */
  skimBlocks: number;
}

/** 0 at the centre of the face, 1 at a corner. */
export const hitOffCentre = (zone: HitZone) =>
  Math.hypot(zone.column, zone.row) / Math.SQRT2;

/**
 * What a hit does to the throw. `random` returns numbers in [0, 1), like
 * `Math.random`; the further the hit is from the centre, the more it wobbles
 * the angle and the power, so edge hits are riskier.
 */
export function shotFromHit(
  zone: HitZone,
  power: number,
  random: () => number
): HitShot {
  const offCentre = hitOffCentre(zone);
  // Centred noise in [-1, 1), scaled by how far off centre the hit was.
  const wobble = () => (random() * 2 - 1) * offCentre;
  const toRadians = Math.PI / 180;

  const angle =
    (-zone.column * config.hitAngleDeg + wobble() * config.hitJitterAngleDeg) *
    toRadians;
  const wobbledPower = Math.max(
    0,
    Math.min(1, power * (1 + wobble() * config.hitJitterPower))
  );

  const grip: ShotGrip =
    zone.row < 0 ? 'low' : zone.row > 0 ? 'lifted' : 'standard';
  return {
    angle,
    power: wobbledPower,
    grip,
    dampScale: grip === 'low' ? config.lowShotDampScale : 1,
    skimBlocks: grip === 'lifted' ? config.liftedSkimBlocks : 0,
  };
}
