import { describe, expect, it } from '@jest/globals';
import { config, yIceFar } from '../config';
import { ScorableCube, scoreRound, zoneValue } from '../scoring';

const far = yIceFar();
const band = config.band;

/** A settled cube whose leading edge sits `depth` blocks behind the back edge. */
const cube = (team: number, depth: number, extra: Partial<ScorableCube> = {}): ScorableCube => ({
  team,
  state: 'settled',
  knockedBack: false,
  forwardEdgeY: far + depth,
  ...extra,
});

describe('zoneValue', () => {
  it.each([
    [-0.2, 4], // overhanging the back edge
    [0, 3],
    [band - 0.01, 3],
    [band, 2],
    [band * 2 - 0.01, 2],
    [band * 2, 1],
    [band * 3 - 0.01, 1],
    [band * 3, 0],
    [20, 0],
  ])('leading edge %p blocks in scores %p', (depth, expected) => {
    expect(zoneValue(cube(0, depth))).toBe(expected);
  });

  it('resolves a cube straddling two bands upwards (D-04)', () => {
    // Leading edge just inside band 2, body still mostly in band 1.
    expect(zoneValue(cube(0, band * 2 - 0.1))).toBe(2);
  });

  it.each(['off_the_back', 'killed_back'] as const)('a cube that is %s is worth nothing', (state) => {
    expect(zoneValue(cube(0, -0.2, { state }))).toBe(0);
  });
});

describe('scoreRound', () => {
  it('is a blank end with no cubes', () => {
    const r = scoreRound([]);
    expect(r.points).toEqual([0, 0]);
    expect(r.leader).toBe(-1);
  });

  it('reproduces the rulebook page 6 example: Red 5, Blue 0', () => {
    const r = scoreRound([
      cube(0, 1), // Red in band 3
      cube(0, band + 0.5), // Red at the top of band 2
      cube(1, band + 1.2), // Blue's best, behind both of those
      cube(1, band + 1.2),
      cube(0, band + 1.6), // Reds behind Blue's leader score nothing
      cube(0, band + 2.2),
      cube(1, band + 2.4),
      cube(1, band + 2.4),
    ]);
    expect(r.leader).toBe(0);
    expect(r.points).toEqual([5, 0]);
    expect(r.scoring).toHaveLength(2);
  });

  it('only scores the leader for cubes ahead of the rival best cube', () => {
    const r = scoreRound([cube(1, 0.5), cube(0, 1), cube(1, band * 2 + 1)]);
    expect(r.leader).toBe(1);
    expect(r.points).toEqual([0, 3]);
  });

  it('scores the 4-point overhang', () => {
    expect(scoreRound([cube(0, -0.3)]).points).toEqual([4, 0]);
  });

  it('gives nothing for a lead held in neutral ice', () => {
    const r = scoreRound([cube(0, 12), cube(1, 15)]);
    expect(r.leader).toBe(0);
    expect(r.points).toEqual([0, 0]);
  });

  it('treats equal best cubes as a blank end', () => {
    const r = scoreRound([cube(0, 1), cube(1, 1)]);
    expect(r.leader).toBe(-1);
    expect(r.points).toEqual([0, 0]);
  });

  it('ignores cubes that left the board', () => {
    const r = scoreRound([cube(1, -0.2, { state: 'off_the_back' }), cube(0, 4)]);
    expect(r.leader).toBe(0);
    expect(r.points).toEqual([2, 0]);
  });

  it('replaces a knocked-back cube with -1 and leaves it out of the lead (D-05)', () => {
    const r = scoreRound([cube(1, 0.5, { knockedBack: true }), cube(0, 4)]);
    expect(r.leader).toBe(0);
    expect(r.penalties).toEqual([0, 1]);
    expect(r.points).toEqual([2, -1]);
    expect(r.summary).toContain('windburst');
  });

  it('does not penalise a knocked-back cube that left the board', () => {
    const r = scoreRound([cube(0, 30, { knockedBack: true, state: 'killed_back' })]);
    expect(r.penalties).toEqual([0, 0]);
  });
});
