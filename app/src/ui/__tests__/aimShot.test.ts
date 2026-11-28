import { describe, expect, it } from '@jest/globals';

import { config } from '../../game/config';
import { type AimDrag, fullPowerDragPx, shotFromDrag } from '../aimShot';

const pixelsPerBlock = 40;
const roomyScreenPx = 1000;

/** A drag that starts at the origin and moves by (moveX, moveY) blocks. */
const dragBy = (moveX: number, moveY: number): AimDrag => ({
  startX: 0,
  startY: 0,
  currentX: moveX,
  currentY: moveY,
});

const degrees = (directionX: number, directionY: number) =>
  (Math.atan2(directionX, -directionY) * 180) / Math.PI;

describe('shotFromDrag', () => {
  it('throws straight up the rink when pulled straight back', () => {
    const shot = shotFromDrag(dragBy(0, 4), pixelsPerBlock, roomyScreenPx);
    expect(shot.directionX).toBeCloseTo(0);
    expect(shot.directionY).toBeCloseTo(-1);
    expect(shot.power).toBeCloseTo((4 * pixelsPerBlock) / 320);
  });

  it('aims opposite to a sideways pull, up to the angle limit', () => {
    const shot = shotFromDrag(dragBy(-1, 4), pixelsPerBlock, roomyScreenPx);
    expect(degrees(shot.directionX, shot.directionY)).toBeCloseTo(
      (Math.atan2(1, 4) * 180) / Math.PI
    );
    const wide = shotFromDrag(dragBy(-4, 1), pixelsPerBlock, roomyScreenPx);
    expect(degrees(wide.directionX, wide.directionY)).toBeCloseTo(
      config.aimMaxAngleDeg
    );
  });

  it('moves the angle continuously as the pull swings across', () => {
    let previousAngle: number | undefined;
    for (let sideways = 2; sideways >= -2; sideways -= 0.25) {
      const shot = shotFromDrag(
        dragBy(sideways, 6),
        pixelsPerBlock,
        roomyScreenPx
      );
      const angle = degrees(shot.directionX, shot.directionY);
      if (previousAngle !== undefined) {
        expect(angle).toBeGreaterThanOrEqual(previousAngle);
        expect(angle - previousAngle).toBeLessThan(5);
      }
      previousAngle = angle;
    }
  });

  it('cancels a forward drag instead of snapping to the angle limit', () => {
    for (const sideways of [-3, -0.5, 0, 0.5, 3]) {
      const shot = shotFromDrag(
        dragBy(sideways, -4),
        pixelsPerBlock,
        roomyScreenPx
      );
      expect(shot.power).toBe(0);
    }
  });

  it('cancels a pull that barely moved', () => {
    expect(
      shotFromDrag(dragBy(0, 0.01), pixelsPerBlock, roomyScreenPx).power
    ).toBe(0);
  });

  it('caps power at 1', () => {
    expect(
      shotFromDrag(dragBy(0, 50), pixelsPerBlock, roomyScreenPx).power
    ).toBe(1);
  });

  it('reaches full power within the room left below the finger', () => {
    const roomBelowPx = 150;
    const pullBlocks = (roomBelowPx * 0.9) / pixelsPerBlock;
    const shot = shotFromDrag(
      dragBy(0, pullBlocks),
      pixelsPerBlock,
      roomBelowPx
    );
    expect(shot.power).toBe(1);
  });
});

describe('fullPowerDragPx', () => {
  it('uses the configured distance when there is room', () => {
    expect(fullPowerDragPx(roomyScreenPx)).toBe(config.aimDragFullPowerPx);
  });

  it('shrinks to fit the room below the finger', () => {
    expect(fullPowerDragPx(200)).toBeCloseTo(200 * config.aimDragRoomShare);
  });

  it('never drops below the minimum pull', () => {
    expect(fullPowerDragPx(20)).toBe(config.aimDragMinFullPowerPx);
  });
});
