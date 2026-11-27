import { describe, expect, it } from '@jest/globals';

import { dispensers, halfWidth, yIceFar, yIceNear } from '../config';
import type { Cube, EngineEvent, Phase } from '../engine';
import { GameEngine } from '../engine';
import type { GameMode } from '../mode';
import { classicMode, defaultMode } from '../mode';

const DT = 1 / 60;

function run(
  engine: GameEngine,
  until: (engine: GameEngine) => boolean,
  maxSeconds = 60
) {
  for (let elapsed = 0; elapsed < maxSeconds; elapsed += DT) {
    if (until(engine)) return;
    engine.update(DT);
  }
  throw new Error(`timed out in phase ${engine.phase}`);
}

const runToPhase = (engine: GameEngine, phase: Phase) =>
  run(engine, (game) => game.phase === phase);

/** Throw and wait until the next throw (or the round break) is ready. */
function throwAndSettle(engine: GameEngine, power: number, dx = 0, dy = -1) {
  engine.launch(dx, dy, power);
  run(engine, (game) => game.phase !== 'sliding');
  run(engine, (game) => game.phase !== 'resolving');
}

function teleport(cube: Cube, game: number, worldY: number) {
  cube.body.setPosition({ x: game, y: worldY } as never);
  cube.x = game;
  cube.y = worldY;
  cube.forwardEdgeY = worldY - 0.5;
}

function newMatch(mode: GameMode = classicMode) {
  const engine = new GameEngine();
  const events: EngineEvent[] = [];
  engine.subscribe((ev) => events.push(ev));
  engine.startMatch(mode);
  return { engine, events };
}

describe('throwing', () => {
  it('starts a match with Red racked on the starting line', () => {
    const { engine } = newMatch();
    expect(engine.phase).toBe('aiming');
    expect(engine.currentTeam).toBe(0);
    expect(engine.shotsLeft).toEqual([
      classicMode.cubesPerRound,
      classicMode.cubesPerRound,
    ]);
    expect(engine.liveCube?.state).toBe('racked');
    expect(engine.liveCube?.y).toBeCloseTo(yIceNear() - 0.5);
  });

  it('lines the cube up along the starting line, inside the walls', () => {
    const { engine } = newMatch();
    engine.placeCubeAtX(3);
    expect(engine.liveCube!.x).toBeCloseTo(3);
    engine.placeCubeAtX(100);
    expect(engine.liveCube!.x).toBeLessThan(halfWidth());
  });

  it('throws further with more power', () => {
    const rest = (power: number) => {
      const { engine } = newMatch();
      const cube = engine.liveCube!;
      engine.launch(0, -1, power);
      run(engine, (game) => game.phase !== 'sliding');
      return cube.y;
    };
    const soft = rest(0.2);
    const hard = rest(0.6);
    expect(hard).toBeLessThan(soft);
    expect(soft).toBeLessThan(yIceNear());
  });

  it('drops a full-power throw off the back of the table', () => {
    const { engine } = newMatch();
    const cube = engine.liveCube!;
    engine.launch(0, -1, 1);
    run(engine, (game) => game.phase !== 'sliding');
    expect(cube.state).toBe('off_the_back');
  });

  it('ignores a second launch while the cube is sliding', () => {
    const { engine } = newMatch();
    engine.launch(0, -1, 0.5);
    const cube = engine.liveCube!;
    engine.update(DT);
    const velocityY = cube.body.getLinearVelocity().y;
    engine.launch(0, -1, 1);
    expect(cube.body.getLinearVelocity().y).toBeCloseTo(velocityY);
  });

  it('bounces off the side walls instead of leaving the rink', () => {
    const { engine } = newMatch();
    const cube = engine.liveCube!;
    engine.launch(Math.sin(0.38), -Math.cos(0.38), 0.4);
    run(engine, (game) => game.phase !== 'sliding');
    expect(Math.abs(cube.x)).toBeLessThan(halfWidth());
  });
});

describe('turns and rounds', () => {
  it('alternates throwers and ends the round after every cube is thrown', () => {
    const { engine, events } = newMatch();
    const order: number[] = [];
    for (
      let throwIndex = 0;
      throwIndex < classicMode.cubesPerRound * 2;
      throwIndex++
    ) {
      order.push(engine.currentTeam);
      engine.placeCubeAtX(-6 + throwIndex * 1.6); // spread out so throws do not collide
      throwAndSettle(engine, 0.3);
    }
    expect(order).toEqual([0, 1, 0, 1, 0, 1, 0, 1]);
    expect(engine.phase).toBe('round_break');
    expect(events.some((ev) => ev.type === 'round_ended')).toBe(true);
  });

  it('alternates the first thrower between rounds (D-08)', () => {
    const { engine } = newMatch();
    for (
      let throwIndex = 0;
      throwIndex < classicMode.cubesPerRound * 2;
      throwIndex++
    ) {
      throwAndSettle(engine, 1);
    }
    runToPhase(engine, 'aiming');
    expect(engine.roundIndex).toBe(1);
    expect(engine.currentTeam).toBe(1);
    expect(engine.cubes).toHaveLength(1); // the board was cleared
  });

  it('floors the match score at zero (D-07)', () => {
    const { engine } = newMatch();
    // Red's first cube gets a windburst penalty; everything else falls off.
    const red = engine.liveCube!;
    engine.launch(0, -1, 0.3);
    run(engine, (game) => game.phase !== 'sliding');
    red.knockedBack = true;
    run(engine, (game) => game.phase === 'aiming');
    while (engine.phase === 'aiming') {
      engine.placeCubeAtX(5); // clear of Red's cube
      throwAndSettle(engine, 1);
    }
    expect(engine.phase).toBe('round_break');
    expect(engine.lastResult?.points).toEqual([-1, 0]);
    expect(engine.scores).toEqual([0, 0]);
  });

  it('declares the first team to the target score the winner', () => {
    const { engine, events } = newMatch();
    engine.scores = [classicMode.targetScore - 1, 0];
    // Red leaves one cube in band 3; every other throw falls off the end.
    const red = engine.liveCube!;
    engine.launch(0, -1, 0.5);
    run(engine, (game) => game.phase !== 'sliding');
    teleport(red, -4, yIceFar() + 1.5); // out of the way of the throws below
    run(engine, (game) => game.phase !== 'resolving');
    while (engine.phase === 'aiming') throwAndSettle(engine, 1);
    expect(engine.phase).toBe('game_over');
    expect(engine.winner).toBe(0);
    expect(
      events.some((ev) => ev.type === 'game_over' && ev.winner === 0)
    ).toBe(true);

    engine.restart();
    expect(engine.scores).toEqual([0, 0]);
    expect(engine.phase).toBe('aiming');
  });
  describe('both teams past the target in the same round', () => {
    const target = classicMode.targetScore;

    /** Play out a blank end: every throw falls off the back for 0 points. */
    function blankEnd(engine: GameEngine) {
      while (engine.phase === 'aiming') throwAndSettle(engine, 1);
      expect(engine.lastResult?.points).toEqual([0, 0]);
    }

    // Only the team holding the front scores, so in the Classic rules one
    // team can't overtake the other in a single round. These tests start the
    // round with totals already at the line to reach findWinner's two-team
    // branch, which a mode where both teams score would hit in play.
    it('gives the match to the higher total', () => {
      const { engine, events } = newMatch();
      engine.scores = [target, target + 2];
      blankEnd(engine);
      expect(engine.phase).toBe('game_over');
      expect(engine.winner).toBe(1);
      expect(events.filter((ev) => ev.type === 'game_over')).toEqual([
        { type: 'game_over', winner: 1 },
      ]);
    });

    it('still picks the higher total when the leader crosses too', () => {
      const { engine } = newMatch();
      engine.scores = [target + 3, target - 1];
      // Blue crosses the target with one cube in the 3-point band; Red's total
      // stays higher.
      throwAndSettle(engine, 1); // Red: off the back
      const blue = engine.liveCube!;
      engine.launch(0, -1, 0.5);
      run(engine, (game) => game.phase !== 'sliding');
      teleport(blue, -4, yIceFar() + 1.5);
      run(engine, (game) => game.phase !== 'resolving');
      while (engine.phase === 'aiming') throwAndSettle(engine, 1);
      expect(engine.lastResult?.points).toEqual([0, 3]);
      expect(engine.scores).toEqual([target + 3, target + 2]);
      expect(engine.winner).toBe(0);
    });

    it('gives a tie on the total to Red', () => {
      const { engine } = newMatch();
      engine.scores = [target + 1, target + 1];
      blankEnd(engine);
      expect(engine.phase).toBe('game_over');
      expect(engine.winner).toBe(0);
    });
  });
});

describe('wind charges', () => {
  it('lets the defender fire only while a cube slides, at most twice per throw', () => {
    const { engine } = newMatch();
    expect(engine.fireWindChargeNear(0, 20)).toBe(false);
    engine.launch(0, -1, 0.5);
    expect(engine.defendingTeam).toBe(1);
    expect(engine.fireWindChargeNear(-7, 10)).toBe(true);
    expect(engine.fireWindChargeNear(7, 10)).toBe(true);
    expect(engine.fireWindChargeNear(7, 12)).toBe(false);
    expect(engine.windChargesLeft).toBe(0);
  });

  it('fires from the dispenser nearest the tap', () => {
    const { engine } = newMatch();
    engine.launch(0, -1, 0.5);
    const target = dispensers()[5];
    engine.fireWindChargeNear(target.x * 0.9, target.y + 0.4);
    expect(engine.charges[0].x).toBe(target.x);
    expect(engine.charges[0].y).toBe(target.y);
    expect(engine.charges[0].dx).toBe(target.nx);
  });

  it('refills the charges for the next throw', () => {
    const { engine } = newMatch();
    engine.launch(0, -1, 0.5);
    engine.fireWindChargeNear(-7, 10);
    run(engine, (game) => game.phase === 'aiming');
    expect(engine.windChargesLeft).toBe(classicMode.windChargesPerThrow);
  });

  /** Blast the thrown cube from just in front of it, sending it backwards. */
  function blastBackwards(engine: GameEngine, cube: Cube) {
    const charge = {
      x: cube.x,
      y: cube.y - 0.6,
      dx: 1,
      dy: 0,
      travelled: 0,
      exploded: false,
      flash: 0,
      blastX: 0,
      blastY: 0,
    };
    engine.charges.push(charge);
    engine.update(DT);
    return charge;
  }

  it('marks the thrown cube knocked back when a blast sends it backwards', () => {
    const { engine } = newMatch();
    const cube = engine.liveCube!;
    engine.launch(0, -1, 0.3);
    run(engine, () => cube.y < yIceNear() - 6);
    cube.body.setLinearVelocity({ x: 0, y: -0.5 } as never);
    blastBackwards(engine, cube);
    expect(cube.knockedBack).toBe(true);
  });

  it('does not penalise a settled cube caught in the blast (D-15)', () => {
    const { engine } = newMatch();
    const red = engine.liveCube!;
    engine.launch(0, -1, 0.3);
    run(engine, (game) => game.phase === 'aiming');
    // Blue throws; the blast lands right in front of Red's settled cube.
    engine.placeCubeAtX(5);
    engine.launch(0, -1, 0.3);
    blastBackwards(engine, red);
    expect(red.state).toBe('live');
    expect(red.knockedBack).toBe(false);
  });

  it('triggers the Round Killer when a knocked-back cube reaches the platform', () => {
    const { engine, events } = newMatch();
    const cube = engine.liveCube!;
    engine.launch(0, -1, 0.3);
    run(engine, () => cube.y < yIceNear() - 4);
    cube.knockedBack = true;
    cube.body.setLinearVelocity({ x: 0, y: 12 } as never);
    run(engine, (game) => game.phase !== 'sliding');
    expect(cube.state).toBe('killed_back');
    expect(engine.roundKilled[0]).toBe(true);
    expect(
      events.some(
        (ev) => ev.type === 'message' && ev.text.includes('ROUND KILLER')
      )
    ).toBe(true);

    // Blue finishes the round alone.
    run(engine, (game) => game.phase === 'aiming');
    const throwers: number[] = [];
    while (engine.phase === 'aiming') {
      throwers.push(engine.currentTeam);
      throwAndSettle(engine, 1);
    }
    expect(throwers).toEqual([1, 1, 1, 1]);
    expect(engine.phase).toBe('round_break');
  });

  it('removes a cube pushed back onto the platform without a windburst, with no penalty (D-06)', () => {
    const { engine } = newMatch();
    const cube = engine.liveCube!;
    engine.launch(0, -1, 0.3);
    run(engine, () => cube.y < yIceNear() - 4);
    cube.body.setLinearVelocity({ x: 0, y: 12 } as never);
    run(engine, (game) => game.phase !== 'sliding');
    expect(cube.state).toBe('off_the_back');
    expect(engine.roundKilled).toEqual([false, false]);
  });
});

describe('knockouts', () => {
  it('a throw can knock a settled cube off the back of the table', () => {
    const { engine } = newMatch();
    const red = engine.liveCube!;
    engine.launch(0, -1, 0.5);
    run(engine, (game) => game.phase !== 'sliding');
    teleport(red, 0, yIceFar() + 1);
    run(engine, (game) => game.phase === 'aiming');
    // Blue fires straight down the middle at full power.
    engine.launch(0, -1, 1);
    run(engine, (game) => game.phase !== 'sliding');
    expect(red.state).toBe('off_the_back');
  });
});

describe('game modes', () => {
  const quick: GameMode = {
    ...classicMode,
    id: 'test-quick',
    name: 'Test quick',
    targetScore: 3,
    cubesPerRound: 2,
    windChargesPerThrow: 1,
  };

  it('plays the default mode when no mode is given', () => {
    const engine = new GameEngine();
    engine.startMatch();
    expect(engine.mode).toEqual(defaultMode);
    expect(defaultMode).toBe(classicMode);
  });

  it('keeps the rulebook rules in the Classic mode', () => {
    expect(classicMode).toMatchObject({
      targetScore: 15,
      cubesPerRound: 4,
      windChargesPerThrow: 2,
      alternateFirstShooter: true,
      allowNegativeMatchScore: false,
    });
  });

  it('uses the cubes per round and wind charges of the mode it was started with', () => {
    // A high target so the first round cannot end the match.
    const { engine } = newMatch({ ...quick, targetScore: 99 });
    expect(engine.shotsLeft).toEqual([2, 2]);
    engine.launch(0, -1, 0.5);
    expect(engine.windChargesLeft).toBe(1);
    expect(engine.fireWindChargeNear(-7, 10)).toBe(true);
    expect(engine.fireWindChargeNear(7, 10)).toBe(false);
    run(engine, (game) => game.phase !== 'sliding');
    run(engine, (game) => game.phase !== 'resolving');
    while (engine.phase === 'aiming') throwAndSettle(engine, 1);
    expect(engine.phase).toBe('round_break');
    expect(engine.cubes).toHaveLength(4);
  });

  it("wins at the mode's target score", () => {
    const { engine } = newMatch(quick);
    engine.scores = [quick.targetScore - 1, 0];
    const red = engine.liveCube!;
    engine.launch(0, -1, 0.5);
    run(engine, (game) => game.phase !== 'sliding');
    teleport(red, -4, yIceFar() + 1.5); // band 3: 1 point
    run(engine, (game) => game.phase !== 'resolving');
    while (engine.phase === 'aiming') throwAndSettle(engine, 1);
    expect(engine.phase).toBe('game_over');
    expect(engine.winner).toBe(0);
  });

  it('keeps the mode on restart and switches it on a new startMatch', () => {
    const { engine } = newMatch(quick);
    engine.restart();
    expect(engine.mode.cubesPerRound).toBe(2);
    engine.startMatch(classicMode);
    expect(engine.mode.cubesPerRound).toBe(4);
    expect(engine.shotsLeft).toEqual([4, 4]);
  });

  it('copies the mode, so changing the object mid-match has no effect', () => {
    const custom: GameMode = { ...quick };
    const { engine } = newMatch(custom);
    custom.targetScore = 99;
    expect(engine.mode.targetScore).toBe(3);
  });
});
