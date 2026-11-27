/**
 * Single source of truth for every tunable number in Double Shuffle.
 *
 * All distances are in BLOCKS (1 block = 1 metre in the physics world = one
 * sulphur cube across). Speeds are blocks/second. The rink runs down +Y and
 * both teams throw from the NEAR (bottom) end towards the FAR (top) end
 * (docs/decisions.md D-01):
 *
 *   y = 0 ................ outer edge of the far platform
 *   y = yIceFar .......... "back of the table": the 4-point overhang line
 *   y = yIceNear ......... the starting line
 *   y = yBoardEnd ........ outer edge of the shooter's own platform
 */

/**
 * Pixels per block. Some speeds below were first tuned in pixels, and `px()`
 * keeps those numbers readable by converting them to blocks.
 */
const PX = 48;
const px = (v: number) => v / PX;

export const config = {
  // Board layout, in blocks
  rinkWidth: 15,
  platform: 5,
  band: 3,
  neutral: 20,
  divider: 0.4,

  // Match rules
  cubesPerRound: 4,
  targetScore: 15,
  windChargesPerThrow: 2,
  alternateFirstShooter: true,
  allowNegativeMatchScore: false,

  // Throw physics (blocks/s)
  launchSpeedMin: px(430),
  launchSpeedMax: px(1850),
  aimDragFullPowerPx: 320,
  aimMaxAngleDeg: 22,

  dampIce: 0.85,
  dampDivider: 3.0,
  dampPlatform: 6.0,
  angularDamp: 4.0,
  wallBounce: 0.45,
  cubeBounce: 0.55,
  stopSpeed: px(16),
  stopTime: 0.22,

  // Wind charges
  dispenserSpacing: 3,
  windTravelSpeed: px(1150),
  windMaxTravel: 9,
  windBlastRadius: 3,
  windBlastImpulse: px(620),
  windBackwardPenaltySpeed: px(40),
  /** Charge detonates when it is this close to a cube's centre. */
  windTriggerDistance: 0.75,

  // Timings (seconds)
  maxSlideSeconds: 25,
  resolveDelay: 0.9,
  /** How long the end-of-round summary stays up before the next round. */
  roundBreakDelay: 9,

  teamColors: ['#d8452f', '#3a7ad9'],
  teamNames: ['Red', 'Blue'],
  colors: {
    ice: '#bed7f2',
    iceBand: ['#aecbee', '#9ebfe9', '#8fb4e5'],
    divider: '#9c9c97',
    platform: '#8a5a2b',
    wall: '#e0b23f',
    startLine: '#35c9c4',
    dispenser: '#3b2a20',
    windCharge: '#2e3a55',
  },
};

export const iceLength = () => config.band * 6 + config.neutral;
export const yIceFar = () => config.platform;
export const yIceNear = () => yIceFar() + iceLength();
export const yBoardEnd = () => yIceNear() + config.platform;
export const halfWidth = () => config.rinkWidth / 2;

/** Band boundaries at the scoring (far) end, nearest the edge first. */
export const farBandBoundaries = () =>
  [1, 2, 3].map((i) => yIceFar() + config.band * i);

/** Same for the decorative bands at the shooter's end. */
export const nearBandBoundaries = () =>
  [1, 2, 3].map((i) => yIceNear() - config.band * i);

export function isOnDivider(y: number): boolean {
  const half = config.divider / 2;
  return [...farBandBoundaries(), ...nearBandBoundaries()].some(
    (b) => Math.abs(y - b) <= half
  );
}

/** Linear damping for whatever surface is under `y`. */
export function dampAt(y: number): number {
  if (y < yIceFar() || y > yIceNear()) return config.dampPlatform;
  if (isOnDivider(y)) return config.dampDivider;
  return config.dampIce;
}

export interface Dispenser {
  x: number;
  y: number;
  /** Unit vector pointing into the rink. */
  nx: number;
  ny: number;
}

export function dispensers(): Dispenser[] {
  const out: Dispenser[] = [];
  const hw = halfWidth();
  for (
    let y = yIceFar() + config.dispenserSpacing;
    y < yIceNear() - 0.02;
    y += config.dispenserSpacing
  ) {
    out.push({ x: -hw, y, nx: 1, ny: 0 });
    out.push({ x: hw, y, nx: -1, ny: 0 });
  }
  return out;
}
