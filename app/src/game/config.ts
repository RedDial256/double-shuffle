/**
 * Global tunables for Double Shuffle: board geometry, colours, timings and the
 * physics that every mode shares. Per-match rules (target score, cubes per
 * round, wind charges, wind strength) live in a `GameMode` (`mode.ts`).
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
export const px = (pixels: number) => pixels / PX;

export const config = {
  // Board layout, in blocks
  rinkWidth: 15,
  platform: 5,
  band: 3,
  neutral: 20,
  divider: 0.4,
  /**
   * How much of each platform the game screen shows, in blocks. A cube past
   * the back edge has fallen off and isn't drawn, so the far platform only
   * needs a sliver; the shooter's platform keeps room to slide the cube
   * sideways and to show a cube knocked back onto it (docs/decisions.md D-27).
   */
  viewFarPlatform: 1,
  viewNearPlatform: 2.5,

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
  windBackwardPenaltySpeed: px(40),
  /** Charge detonates when it is this close to a cube's centre. */
  windTriggerDistance: 1.05,
  /** How long a blast's ring and the flash on the cubes it hits last. */
  windBlastFlashSeconds: 0.5,

  // Timings (seconds)
  maxSlideSeconds: 25,
  resolveDelay: 0.9,
  /** How long the end-of-round summary stays up before the next round. */
  roundBreakDelay: 9,

  teamNames: ['Red', 'Blue'],
};

export const iceLength = () => config.band * 6 + config.neutral;
export const yIceFar = () => config.platform;
export const yIceNear = () => yIceFar() + iceLength();
export const yBoardEnd = () => yIceNear() + config.platform;
export const halfWidth = () => config.rinkWidth / 2;
/** Top and bottom of the part of the board the game screen shows. */
export const yViewTop = () => yIceFar() - config.viewFarPlatform;
export const yViewBottom = () => yIceNear() + config.viewNearPlatform;

/** Band boundaries at the scoring (far) end, nearest the edge first. */
export const farBandBoundaries = () =>
  [1, 2, 3].map((bandIndex) => yIceFar() + config.band * bandIndex);

/** Same for the decorative bands at the shooter's end. */
export const nearBandBoundaries = () =>
  [1, 2, 3].map((bandIndex) => yIceNear() - config.band * bandIndex);

export function isOnDivider(worldY: number): boolean {
  const half = config.divider / 2;
  return [...farBandBoundaries(), ...nearBandBoundaries()].some(
    (boundaryY) => Math.abs(worldY - boundaryY) <= half
  );
}

/** Linear damping for whatever surface is under `y`. */
export function dampAt(worldY: number): number {
  if (worldY < yIceFar() || worldY > yIceNear()) return config.dampPlatform;
  if (isOnDivider(worldY)) return config.dampDivider;
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
    let dispenserY = yIceFar() + config.dispenserSpacing;
    dispenserY < yIceNear() - 0.02;
    dispenserY += config.dispenserSpacing
  ) {
    out.push({ x: -hw, y: dispenserY, nx: 1, ny: 0 });
    out.push({ x: hw, y: dispenserY, nx: -1, ny: 0 });
  }
  return out;
}
