import { describe, expect, it } from '@jest/globals';

import { config, yIceFar } from '../config';
import type { Phase } from '../engine';
import { GameEngine } from '../engine';
import { describeCubes, formatSigned, summariseRound } from '../roundSummary';
import type { ScorableCube } from '../scoring';
import { scoreRound } from '../scoring';

const far = yIceFar();
const band = config.band;

const cube = (
  team: number,
  depth: number,
  extra: Partial<ScorableCube> = {}
): ScorableCube => ({
  team,
  state: 'settled',
  knockedBack: false,
  forwardEdgeY: far + depth,
  ...extra,
});

describe('scoreRound per-cube values', () => {
  it('lists the value of each scoring cube next to it', () => {
    const r = scoreRound([
      cube(0, 1), // 3
      cube(0, band * 2 + 0.5), // 1
      cube(1, band * 2 + 1), // Blue is behind every Red cube
      cube(0, -0.2), // 4, overhang
    ]);
    expect(r.leader).toBe(0);
    expect(r.scoringValues).toEqual([3, 1, 4]);
    expect(r.scoringValues.reduce((a, b) => a + b, 0)).toBe(r.points[0]);
  });
});

describe('summariseRound', () => {
  it('reports the rulebook page 6 example as Red holding with 3 + 2', () => {
    const r = scoreRound([
      cube(0, 1),
      cube(0, band + 1),
      cube(1, band * 2 + 1),
    ]);
    const s = summariseRound(r, 2, [7, 4]);
    expect(s.round).toBe(2);
    expect(s.headline).toBe('Red holds the front');
    expect(s.teams[0]).toMatchObject({
      scored: 5,
      cubeValues: [3, 2],
      net: 5,
      total: 7,
    });
    expect(s.teams[1]).toMatchObject({
      scored: 0,
      cubeValues: [],
      net: 0,
      total: 4,
    });
    expect(describeCubes(s.teams[0])).toBe('3 + 2 = 5');
    expect(describeCubes(s.teams[1])).toBe('no cubes scored');
  });

  it('calls a round with no leader a blank end', () => {
    const s = summariseRound(scoreRound([]), 1, [0, 0]);
    expect(s.leader).toBe(-1);
    expect(s.headline).toMatch(/blank end/i);
  });

  it('shows windburst penalties separately from the points scored', () => {
    const r = scoreRound([
      cube(0, 1),
      cube(1, band + 1, { knockedBack: true }),
    ]);
    const s = summariseRound(r, 1, [3, 0]);
    expect(s.teams[1]).toMatchObject({ scored: 0, penalties: 1, net: -1 });
    expect(s.teams[0]).toMatchObject({ scored: 3, penalties: 0, net: 3 });
    expect(describeCubes(s.teams[0])).toBe('3 from 1 cube');
  });

  it('formats signed round totals', () => {
    expect(formatSigned(5)).toBe('+5');
    expect(formatSigned(0)).toBe('0');
    expect(formatSigned(-2)).toBe('−2');
  });
});

describe('round break', () => {
  const DT = 1 / 60;
  function runToPhase(e: GameEngine, phase: Phase, maxSeconds = 120) {
    for (let t = 0; t < maxSeconds; t += DT) {
      if (e.phase === phase) return;
      e.update(DT);
    }
    throw new Error(`timed out in phase ${e.phase}`);
  }
  function playRound(e: GameEngine) {
    for (let i = 0; i < config.cubesPerRound * 2; i++) {
      runToPhase(e, 'aiming');
      e.launch(0, -1, 1); // full power: off the back, nothing scores
      runToPhase(e, 'resolving');
    }
    runToPhase(e, 'round_break');
  }

  it('keeps the summary up for roundBreakDelay, then starts the next round', () => {
    const e = new GameEngine();
    e.startMatch();
    playRound(e);
    expect(e.lastResultRound).toBe(1);
    expect(e.lastResult).not.toBeNull();

    for (let t = 0; t < config.roundBreakDelay - 0.5; t += DT) e.update(DT);
    expect(e.phase).toBe('round_break');
    for (let t = 0; t < 1; t += DT) e.update(DT);
    expect(e.phase).toBe('aiming');
    expect(e.roundIndex).toBe(1);
  });

  it('starts the next round early on nextRound()', () => {
    const e = new GameEngine();
    e.startMatch();
    playRound(e);
    e.nextRound();
    expect(e.phase).toBe('aiming');
    expect(e.cubes).toHaveLength(1);
    // The old timer must not restart the round again later.
    const id = e.liveCube!.id;
    for (let t = 0; t < config.roundBreakDelay + 1; t += DT) e.update(DT);
    expect(e.liveCube?.id).toBe(id);
  });

  it('ignores nextRound() outside the round break', () => {
    const e = new GameEngine();
    e.startMatch();
    const id = e.liveCube!.id;
    e.nextRound();
    expect(e.liveCube!.id).toBe(id);
  });
});
