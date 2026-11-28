import { describe, expect, it } from '@jest/globals';

import { config } from '../../game/config';
import { fullPowerSwipePx, hitZoneAt, swipePower } from '../throwSwipe';

describe('swipePower', () => {
  it('ignores a downward or tiny swipe', () => {
    expect(swipePower(-40, 240)).toBe(0);
    expect(swipePower(config.throwSwipeDeadZonePx - 1, 240)).toBe(0);
  });

  it('grows with the swipe and caps at full power', () => {
    const full = fullPowerSwipePx(240);
    expect(swipePower(full / 2, 240)).toBeCloseTo(0.5);
    expect(swipePower(full, 240)).toBe(1);
    expect(swipePower(full * 2, 240)).toBe(1);
  });

  it('never asks a short panel for less than the minimum', () => {
    expect(fullPowerSwipePx(40)).toBe(config.throwSwipeMinFullPowerPx);
  });
});

describe('hitZoneAt', () => {
  it('maps the face into a 3×3 grid', () => {
    expect(hitZoneAt(10, 10, 90)).toEqual({ column: -1, row: -1 });
    expect(hitZoneAt(45, 45, 90)).toEqual({ column: 0, row: 0 });
    expect(hitZoneAt(80, 50, 90)).toEqual({ column: 1, row: 0 });
    expect(hitZoneAt(50, 89, 90)).toEqual({ column: 0, row: 1 });
  });

  it('returns null outside the face', () => {
    expect(hitZoneAt(-1, 10, 90)).toBeNull();
    expect(hitZoneAt(10, 91, 90)).toBeNull();
    expect(hitZoneAt(10, 10, 0)).toBeNull();
  });
});
