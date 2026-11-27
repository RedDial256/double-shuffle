import { describe, expect, it } from '@jest/globals';

import { GameEngine } from '../engine';

const DT = 1 / 60;

describe('pausing', () => {
  it('freezes a sliding cube and resumes from the same spot', () => {
    const e = new GameEngine();
    e.startMatch();
    const cube = e.liveCube!;
    e.launch(0, -1, 0.8);
    for (let i = 0; i < 10; i++) e.update(DT);
    const y = cube.y;

    e.setPaused(true);
    for (let i = 0; i < 600; i++) e.update(DT);
    expect(cube.y).toBe(y);
    expect(e.phase).toBe('sliding');

    e.setPaused(false);
    for (let i = 0; i < 10; i++) e.update(DT);
    expect(cube.y).toBeLessThan(y);
  });

  it('holds the between-throw timer while paused', () => {
    const e = new GameEngine();
    e.startMatch();
    e.launch(0, -1, 0.5);
    for (let t = 0; t < 60 && e.phase === 'sliding'; t += DT) e.update(DT);
    expect(e.phase).toBe('resolving');

    e.setPaused(true);
    for (let i = 0; i < 600; i++) e.update(DT);
    expect(e.phase).toBe('resolving');

    e.setPaused(false);
    for (let t = 0; t < 5 && e.phase === 'resolving'; t += DT) e.update(DT);
    expect(e.phase).toBe('aiming');
    expect(e.currentTeam).toBe(1);
  });
});
