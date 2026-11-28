import { config } from '../game/config';

/** A pull-back drag on the rink, in world units (blocks). */
export interface AimDrag {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface AimShot {
  /** Unit vector of the throw. Forward is -Y. */
  directionX: number;
  directionY: number;
  /** 0 (no throw) to 1 (full power). */
  power: number;
}

/** Drags shorter than this, in world units, keep the straight-ahead aim. */
const minimumAimLength = 0.02;

/**
 * Screen distance of a full-power pull from a drag that starts with
 * `roomBelowStartPx` of screen below the finger. The finger can't pull past
 * the bottom of the screen, so full power has to fit in the room that is
 * there, down to a floor that keeps the control from getting twitchy.
 */
export function fullPowerDragPx(roomBelowStartPx: number): number {
  const reachable = roomBelowStartPx * config.aimDragRoomShare;
  return Math.max(
    config.aimDragMinFullPowerPx,
    Math.min(config.aimDragFullPowerPx, reachable)
  );
}

/**
 * The throw implied by a slingshot drag: pull back (towards the shooter) to
 * aim forward, and pull further for more power.
 *
 * A drag that ends ahead of where it started is not a pull-back, so it
 * cancels the throw (power 0) rather than being folded into a shot. Sideways
 * pulls are clamped to `aimMaxAngleDeg`, and the angle moves continuously up
 * to that limit.
 */
export function shotFromDrag(
  drag: AimDrag,
  pixelsPerBlock: number,
  roomBelowStartPx: number
): AimShot {
  // The throw goes from the finger back towards where the drag started.
  const pullX = drag.startX - drag.currentX;
  const pullY = drag.startY - drag.currentY;
  const pullLength = Math.hypot(pullX, pullY);

  const straightAhead = { directionX: 0, directionY: -1 };
  if (pullLength <= minimumAimLength) return { ...straightAhead, power: 0 };
  // A throw must head up the rink (-Y), so the finger must have moved back.
  if (pullY >= 0) return { ...straightAhead, power: 0 };

  const angleLimit = (config.aimMaxAngleDeg * Math.PI) / 180;
  const angle = Math.max(
    -angleLimit,
    Math.min(angleLimit, Math.atan2(pullX, -pullY))
  );
  const pullPx = pullLength * pixelsPerBlock;
  const power = Math.min(1, pullPx / fullPowerDragPx(roomBelowStartPx));
  return {
    directionX: Math.sin(angle),
    directionY: -Math.cos(angle),
    power,
  };
}
