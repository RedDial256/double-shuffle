import { describe, expect, it } from '@jest/globals';

import { GameEngine } from '../engine';

const DT = 1 / 60;

describe('pausing', () => {
  it('freezes a sliding cube and resumes from the same spot', () => {
    const engine = new GameEngine();
    engine.startMatch();
    const cube = engine.liveCube!;
    engine.launch(0, -1, 0.8);
    for (let step = 0; step < 10; step++) engine.update(DT);
    const startY = cube.y;

    engine.setPaused(true);
    for (let step = 0; step < 600; step++) engine.update(DT);
    expect(cube.y).toBe(startY);
    expect(engine.phase).toBe('sliding');

    engine.setPaused(false);
    for (let step = 0; step < 10; step++) engine.update(DT);
    expect(cube.y).toBeLessThan(startY);
  });

  it('holds the between-throw timer while paused', () => {
    const engine = new GameEngine();
    engine.startMatch();
    engine.launch(0, -1, 0.5);
    for (
      let elapsed = 0;
      elapsed < 60 && engine.phase === 'sliding';
      elapsed += DT
    ) {
      engine.update(DT);
    }
    expect(engine.phase).toBe('resolving');

    engine.setPaused(true);
    for (let step = 0; step < 600; step++) engine.update(DT);
    expect(engine.phase).toBe('resolving');

    engine.setPaused(false);
    for (
      let elapsed = 0;
      elapsed < 5 && engine.phase === 'resolving';
      elapsed += DT
    ) {
      engine.update(DT);
    }
    expect(engine.phase).toBe('aiming');
    expect(engine.currentTeam).toBe(1);
  });
});
