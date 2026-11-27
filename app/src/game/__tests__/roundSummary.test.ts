import { describe, expect, it } from '@jest/globals';

import { config, yIceFar } from '../config';
import type { Phase } from '../engine';
import { GameEngine } from '../engine';
import { classicMode } from '../mode';
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
    const result = scoreRound([
      cube(0, 1), // 3
      cube(0, band * 2 + 0.5), // 1
      cube(1, band * 2 + 1), // Blue is behind every Red cube
      cube(0, -0.2), // 4, overhang
    ]);
    expect(result.leader).toBe(0);
    expect(result.scoringValues).toEqual([3, 1, 4]);
    expect(result.scoringValues.reduce((sum, value) => sum + value, 0)).toBe(
      result.points[0]
    );
  });
});

describe('summariseRound', () => {
  it('reports the rulebook page 6 example as Red holding with 3 + 2', () => {
    const result = scoreRound([
      cube(0, 1),
      cube(0, band + 1),
      cube(1, band * 2 + 1),
    ]);
    const summary = summariseRound(result, 2, [7, 4]);
    expect(summary.round).toBe(2);
    expect(summary.headline).toBe('Red holds the front');
    expect(summary.teams[0]).toMatchObject({
      scored: 5,
      cubeValues: [3, 2],
      net: 5,
      total: 7,
    });
    expect(summary.teams[1]).toMatchObject({
      scored: 0,
      cubeValues: [],
      net: 0,
      total: 4,
    });
    expect(describeCubes(summary.teams[0])).toBe('3 + 2 = 5');
    expect(describeCubes(summary.teams[1])).toBe('no cubes scored');
  });

  it('calls a round with no leader a blank end', () => {
    const summary = summariseRound(scoreRound([]), 1, [0, 0]);
    expect(summary.leader).toBe(-1);
    expect(summary.headline).toMatch(/blank end/i);
  });

  it('shows windburst penalties separately from the points scored', () => {
    const result = scoreRound([
      cube(0, 1),
      cube(1, band + 1, { knockedBack: true }),
    ]);
    const summary = summariseRound(result, 1, [3, 0]);
    expect(summary.teams[1]).toMatchObject({
      scored: 0,
      penalties: 1,
      net: -1,
    });
    expect(summary.teams[0]).toMatchObject({ scored: 3, penalties: 0, net: 3 });
    expect(describeCubes(summary.teams[0])).toBe('3 from 1 cube');
  });

  it('formats signed round totals', () => {
    expect(formatSigned(5)).toBe('+5');
    expect(formatSigned(0)).toBe('0');
    expect(formatSigned(-2)).toBe('−2');
  });
});

describe('round break', () => {
  const DT = 1 / 60;
  function runToPhase(engine: GameEngine, phase: Phase, maxSeconds = 120) {
    for (let elapsed = 0; elapsed < maxSeconds; elapsed += DT) {
      if (engine.phase === phase) return;
      engine.update(DT);
    }
    throw new Error(`timed out in phase ${engine.phase}`);
  }
  function playRound(engine: GameEngine) {
    for (
      let throwIndex = 0;
      throwIndex < classicMode.cubesPerRound * 2;
      throwIndex++
    ) {
      runToPhase(engine, 'aiming');
      engine.launch(0, -1, 1); // full power: off the back, nothing scores
      runToPhase(engine, 'resolving');
    }
    runToPhase(engine, 'round_break');
  }

  it('keeps the summary up for roundBreakDelay, then starts the next round', () => {
    const engine = new GameEngine();
    engine.startMatch();
    playRound(engine);
    expect(engine.lastResultRound).toBe(1);
    expect(engine.lastResult).not.toBeNull();

    for (
      let elapsed = 0;
      elapsed < config.roundBreakDelay - 0.5;
      elapsed += DT
    ) {
      engine.update(DT);
    }
    expect(engine.phase).toBe('round_break');
    for (let elapsed = 0; elapsed < 1; elapsed += DT) engine.update(DT);
    expect(engine.phase).toBe('aiming');
    expect(engine.roundIndex).toBe(1);
  });

  it('starts the next round early on nextRound()', () => {
    const engine = new GameEngine();
    engine.startMatch();
    playRound(engine);
    engine.nextRound();
    expect(engine.phase).toBe('aiming');
    expect(engine.cubes).toHaveLength(1);
    // The old timer must not restart the round again later.
    const id = engine.liveCube!.id;
    for (let elapsed = 0; elapsed < config.roundBreakDelay + 1; elapsed += DT) {
      engine.update(DT);
    }
    expect(engine.liveCube?.id).toBe(id);
  });

  it('ignores nextRound() outside the round break', () => {
    const engine = new GameEngine();
    engine.startMatch();
    const id = engine.liveCube!.id;
    engine.nextRound();
    expect(engine.liveCube!.id).toBe(id);
  });
});
