import { config } from '../game/config';
import type { HitAxis, HitZone } from '../game/hitZone';

/** Pixels of upward swipe that give full power, from the panel's height. */
export function fullPowerSwipePx(panelHeightPx: number): number {
  return Math.max(
    config.throwSwipeMinFullPowerPx,
    panelHeightPx * config.throwSwipeRoomShare
  );
}

/**
 * Power for a swipe that has moved `swipeUpPx` pixels up the panel (negative
 * when it moved down). Below the dead zone it is 0, so a stray touch never
 * throws.
 */
export function swipePower(swipeUpPx: number, panelHeightPx: number): number {
  if (swipeUpPx < config.throwSwipeDeadZonePx) return 0;
  return Math.min(1, swipeUpPx / fullPowerSwipePx(panelHeightPx));
}

const toAxis = (share: number): HitAxis =>
  share < 1 / 3 ? -1 : share < 2 / 3 ? 0 : 1;

/**
 * The hit zone under a touch on the cube's face, or null outside it. The
 * touch is relative to the face's top-left corner, and `size` is its side.
 */
export function hitZoneAt(
  touchX: number,
  touchY: number,
  size: number
): HitZone | null {
  if (size <= 0 || touchX < 0 || touchY < 0) return null;
  if (touchX > size || touchY > size) return null;
  return { column: toAxis(touchX / size), row: toAxis(touchY / size) };
}
