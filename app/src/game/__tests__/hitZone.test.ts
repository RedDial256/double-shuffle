import { describe, expect, it } from '@jest/globals';

import { config } from '../config';
import { GameEngine } from '../engine';
import {
  centreHit,
  hitOffCentre,
  type HitZone,
  hitZones,
  shotFromHit,
} from '../hitZone';
import { classicMode } from '../mode';

/** Random source that always returns the middle, so there is no wobble. */
const steady = () => 0.5;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

describe('shotFromHit', () => {
  it('lists all nine zones', () => {
    expect(hitZones).toHaveLength(9);
    expect(hitZones[4]).toEqual(centreHit);
  });

  it('leaves a centre hit straight, standard and steady', () => {
    for (const randomValue of [0, 0.3, 0.99]) {
      const shot = shotFromHit(centreHit, 0.7, () => randomValue);
      expect(shot.angle).toBeCloseTo(0);
      expect(shot.power).toBeCloseTo(0.7);
      expect(shot.grip).toBe('standard');
      expect(shot.dampScale).toBe(1);
      expect(shot.skimBlocks).toBe(0);
    }
  });

  it('sends a left hit right and a right hit left', () => {
    const left = shotFromHit({ column: -1, row: 0 }, 0.5, steady);
    const right = shotFromHit({ column: 1, row: 0 }, 0.5, steady);
    expect(toDegrees(left.angle)).toBeCloseTo(config.hitAngleDeg);
    expect(toDegrees(right.angle)).toBeCloseTo(-config.hitAngleDeg);
  });

  it('makes a top hit grip and a bottom hit skim', () => {
    const low = shotFromHit({ column: 0, row: -1 }, 0.5, steady);
    const lifted = shotFromHit({ column: 0, row: 1 }, 0.5, steady);
    expect(low.grip).toBe('low');
    expect(low.dampScale).toBe(config.lowShotDampScale);
    expect(low.skimBlocks).toBe(0);
    expect(lifted.grip).toBe('lifted');
    expect(lifted.dampScale).toBe(1);
    expect(lifted.skimBlocks).toBe(config.liftedSkimBlocks);
  });

  it('wobbles more the further the hit is from the centre', () => {
    const corner: HitZone = { column: 1, row: 1 };
    const edge: HitZone = { column: 1, row: 0 };
    expect(hitOffCentre(corner)).toBeCloseTo(1);
    expect(hitOffCentre(edge)).toBeCloseTo(Math.SQRT1_2);

    const cornerHigh = shotFromHit(corner, 0.5, () => 0.999);
    const cornerLow = shotFromHit(corner, 0.5, () => 0);
    const spread = toDegrees(cornerHigh.angle - cornerLow.angle);
    expect(spread).toBeGreaterThan(config.hitJitterAngleDeg * 1.9);
    expect(spread).toBeLessThanOrEqual(config.hitJitterAngleDeg * 2);
    expect(cornerHigh.power).toBeLessThanOrEqual(
      0.5 * (1 + config.hitJitterPower)
    );
    expect(cornerLow.power).toBeGreaterThanOrEqual(
      0.5 * (1 - config.hitJitterPower)
    );

    const edgeHigh = shotFromHit(edge, 0.5, () => 0.999);
    const edgeLow = shotFromHit(edge, 0.5, () => 0);
    expect(toDegrees(edgeHigh.angle - edgeLow.angle)).toBeLessThan(spread);
  });

  it('keeps power between 0 and 1', () => {
    expect(shotFromHit({ column: 1, row: 1 }, 1, () => 0.999).power).toBe(1);
    expect(shotFromHit({ column: 1, row: 1 }, 0, () => 0).power).toBe(0);
  });
});

/** Throws straight at `power` with a hit zone and returns where it settles. */
function settleAfter(zone: HitZone, power = 0.5) {
  const engine = new GameEngine();
  engine.random = steady;
  engine.startMatch(classicMode);
  const cube = engine.liveCube!;
  engine.launch(0, -1, power, zone);
  for (let elapsed = 0; elapsed < 30 && engine.phase === 'sliding';) {
    engine.update(1 / 60);
    elapsed += 1 / 60;
  }
  return { x: cube.x, y: cube.y, state: cube.state };
}

describe('engine hit zones', () => {
  it('curves the throw away from the side that was hit', () => {
    const fromLeft = settleAfter({ column: -1, row: 0 });
    const centre = settleAfter(centreHit);
    const fromRight = settleAfter({ column: 1, row: 0 });
    expect(centre.x).toBeCloseTo(0, 1);
    expect(fromLeft.x).toBeGreaterThan(1);
    expect(fromRight.x).toBeLessThan(-1);
  });

  it('stops a low shot short and lets a lifted shot run further', () => {
    const low = settleAfter({ column: 0, row: -1 });
    const standard = settleAfter(centreHit);
    const lifted = settleAfter({ column: 0, row: 1 });
    // Forward is -Y, so further down the rink is a smaller y.
    expect(low.y).toBeGreaterThan(standard.y + 1);
    expect(lifted.y).toBeLessThan(standard.y - 1);
  });

  it('keeps the old three-argument launch as a centre hit', () => {
    const engine = new GameEngine();
    engine.startMatch(classicMode);
    engine.launch(0, -1, 0.5);
    expect(engine.lastShot?.grip).toBe('standard');
    expect(engine.lastShot?.angle).toBeCloseTo(0);
  });
});
