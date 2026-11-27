import { describe, expect, it } from '@jest/globals';

import { config, dispensers, halfWidth, yIceFar, yIceNear } from '../config';
import type { Cube, EngineEvent, Phase } from '../engine';
import { GameEngine } from '../engine';

const DT = 1 / 60;

function run(
  e: GameEngine,
  until: (e: GameEngine) => boolean,
  maxSeconds = 60
) {
  for (let t = 0; t < maxSeconds; t += DT) {
    if (until(e)) return;
    e.update(DT);
  }
  throw new Error(`timed out in phase ${e.phase}`);
}

const runToPhase = (e: GameEngine, phase: Phase) =>
  run(e, (x) => x.phase === phase);

/** Throw and wait until the next throw (or the round break) is ready. */
function throwAndSettle(e: GameEngine, power: number, dx = 0, dy = -1) {
  e.launch(dx, dy, power);
  run(e, (x) => x.phase !== 'sliding');
  run(e, (x) => x.phase !== 'resolving');
}

function teleport(c: Cube, x: number, y: number) {
  c.body.setPosition({ x, y } as never);
  c.x = x;
  c.y = y;
  c.forwardEdgeY = y - 0.5;
}

function newMatch() {
  const e = new GameEngine();
  const events: EngineEvent[] = [];
  e.subscribe((ev) => events.push(ev));
  e.startMatch();
  return { e, events };
}

describe('throwing', () => {
  it('starts a match with Red racked on the starting line', () => {
    const { e } = newMatch();
    expect(e.phase).toBe('aiming');
    expect(e.currentTeam).toBe(0);
    expect(e.shotsLeft).toEqual([config.cubesPerRound, config.cubesPerRound]);
    expect(e.liveCube?.state).toBe('racked');
    expect(e.liveCube?.y).toBeCloseTo(yIceNear() - 0.5);
  });

  it('lines the cube up along the starting line, inside the walls', () => {
    const { e } = newMatch();
    e.placeCubeAtX(3);
    expect(e.liveCube!.x).toBeCloseTo(3);
    e.placeCubeAtX(100);
    expect(e.liveCube!.x).toBeLessThan(halfWidth());
  });

  it('throws further with more power', () => {
    const rest = (power: number) => {
      const { e } = newMatch();
      const c = e.liveCube!;
      e.launch(0, -1, power);
      run(e, (x) => x.phase !== 'sliding');
      return c.y;
    };
    const soft = rest(0.2);
    const hard = rest(0.6);
    expect(hard).toBeLessThan(soft);
    expect(soft).toBeLessThan(yIceNear());
  });

  it('drops a full-power throw off the back of the table', () => {
    const { e } = newMatch();
    const c = e.liveCube!;
    e.launch(0, -1, 1);
    run(e, (x) => x.phase !== 'sliding');
    expect(c.state).toBe('off_the_back');
  });

  it('ignores a second launch while the cube is sliding', () => {
    const { e } = newMatch();
    e.launch(0, -1, 0.5);
    const c = e.liveCube!;
    e.update(DT);
    const v = c.body.getLinearVelocity().y;
    e.launch(0, -1, 1);
    expect(c.body.getLinearVelocity().y).toBeCloseTo(v);
  });

  it('bounces off the side walls instead of leaving the rink', () => {
    const { e } = newMatch();
    const c = e.liveCube!;
    e.launch(Math.sin(0.38), -Math.cos(0.38), 0.4);
    run(e, (x) => x.phase !== 'sliding');
    expect(Math.abs(c.x)).toBeLessThan(halfWidth());
  });
});

describe('turns and rounds', () => {
  it('alternates throwers and ends the round after every cube is thrown', () => {
    const { e, events } = newMatch();
    const order: number[] = [];
    for (let i = 0; i < config.cubesPerRound * 2; i++) {
      order.push(e.currentTeam);
      e.placeCubeAtX(-6 + i * 1.6); // spread out so throws do not collide
      throwAndSettle(e, 0.3);
    }
    expect(order).toEqual([0, 1, 0, 1, 0, 1, 0, 1]);
    expect(e.phase).toBe('round_break');
    expect(events.some((ev) => ev.type === 'round_ended')).toBe(true);
  });

  it('alternates the first thrower between rounds (D-08)', () => {
    const { e } = newMatch();
    for (let i = 0; i < config.cubesPerRound * 2; i++) throwAndSettle(e, 1);
    runToPhase(e, 'aiming');
    expect(e.roundIndex).toBe(1);
    expect(e.currentTeam).toBe(1);
    expect(e.cubes).toHaveLength(1); // the board was cleared
  });

  it('floors the match score at zero (D-07)', () => {
    const { e } = newMatch();
    // Red's first cube gets a windburst penalty; everything else falls off.
    const red = e.liveCube!;
    e.launch(0, -1, 0.3);
    run(e, (x) => x.phase !== 'sliding');
    red.knockedBack = true;
    run(e, (x) => x.phase === 'aiming');
    while (e.phase === 'aiming') {
      e.placeCubeAtX(5); // clear of Red's cube
      throwAndSettle(e, 1);
    }
    expect(e.phase).toBe('round_break');
    expect(e.lastResult?.points).toEqual([-1, 0]);
    expect(e.scores).toEqual([0, 0]);
  });

  it('declares the first team to the target score the winner', () => {
    const { e, events } = newMatch();
    e.scores = [config.targetScore - 1, 0];
    // Red leaves one cube in band 3; every other throw falls off the end.
    const red = e.liveCube!;
    e.launch(0, -1, 0.5);
    run(e, (x) => x.phase !== 'sliding');
    teleport(red, -4, yIceFar() + 1.5); // out of the way of the throws below
    run(e, (x) => x.phase !== 'resolving');
    while (e.phase === 'aiming') throwAndSettle(e, 1);
    expect(e.phase).toBe('game_over');
    expect(e.winner).toBe(0);
    expect(
      events.some((ev) => ev.type === 'game_over' && ev.winner === 0)
    ).toBe(true);

    e.restart();
    expect(e.scores).toEqual([0, 0]);
    expect(e.phase).toBe('aiming');
  });
});

describe('wind charges', () => {
  it('lets the defender fire only while a cube slides, at most twice per throw', () => {
    const { e } = newMatch();
    expect(e.fireWindChargeNear(0, 20)).toBe(false);
    e.launch(0, -1, 0.5);
    expect(e.defendingTeam).toBe(1);
    expect(e.fireWindChargeNear(-7, 10)).toBe(true);
    expect(e.fireWindChargeNear(7, 10)).toBe(true);
    expect(e.fireWindChargeNear(7, 12)).toBe(false);
    expect(e.windChargesLeft).toBe(0);
  });

  it('fires from the dispenser nearest the tap', () => {
    const { e } = newMatch();
    e.launch(0, -1, 0.5);
    const target = dispensers()[5];
    e.fireWindChargeNear(target.x * 0.9, target.y + 0.4);
    expect(e.charges[0].x).toBe(target.x);
    expect(e.charges[0].y).toBe(target.y);
    expect(e.charges[0].dx).toBe(target.nx);
  });

  it('refills the charges for the next throw', () => {
    const { e } = newMatch();
    e.launch(0, -1, 0.5);
    e.fireWindChargeNear(-7, 10);
    run(e, (x) => x.phase === 'aiming');
    expect(e.windChargesLeft).toBe(config.windChargesPerThrow);
  });

  /** Blast the thrown cube from just in front of it, sending it backwards. */
  function blastBackwards(e: GameEngine, cube: Cube) {
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
    e.charges.push(charge);
    e.update(DT);
    return charge;
  }

  it('marks the thrown cube knocked back when a blast sends it backwards', () => {
    const { e } = newMatch();
    const c = e.liveCube!;
    e.launch(0, -1, 0.3);
    run(e, () => c.y < yIceNear() - 6);
    c.body.setLinearVelocity({ x: 0, y: -0.5 } as never);
    blastBackwards(e, c);
    expect(c.knockedBack).toBe(true);
  });

  it('does not penalise a settled cube caught in the blast (D-15)', () => {
    const { e } = newMatch();
    const red = e.liveCube!;
    e.launch(0, -1, 0.3);
    run(e, (x) => x.phase === 'aiming');
    // Blue throws; the blast lands right in front of Red's settled cube.
    e.placeCubeAtX(5);
    e.launch(0, -1, 0.3);
    blastBackwards(e, red);
    expect(red.state).toBe('live');
    expect(red.knockedBack).toBe(false);
  });

  it('triggers the Round Killer when a knocked-back cube reaches the platform', () => {
    const { e, events } = newMatch();
    const c = e.liveCube!;
    e.launch(0, -1, 0.3);
    run(e, () => c.y < yIceNear() - 4);
    c.knockedBack = true;
    c.body.setLinearVelocity({ x: 0, y: 12 } as never);
    run(e, (x) => x.phase !== 'sliding');
    expect(c.state).toBe('killed_back');
    expect(e.roundKilled[0]).toBe(true);
    expect(
      events.some(
        (ev) => ev.type === 'message' && ev.text.includes('ROUND KILLER')
      )
    ).toBe(true);

    // Blue finishes the round alone.
    run(e, (x) => x.phase === 'aiming');
    const throwers: number[] = [];
    while (e.phase === 'aiming') {
      throwers.push(e.currentTeam);
      throwAndSettle(e, 1);
    }
    expect(throwers).toEqual([1, 1, 1, 1]);
    expect(e.phase).toBe('round_break');
  });

  it('removes a cube pushed back onto the platform without a windburst, with no penalty (D-06)', () => {
    const { e } = newMatch();
    const c = e.liveCube!;
    e.launch(0, -1, 0.3);
    run(e, () => c.y < yIceNear() - 4);
    c.body.setLinearVelocity({ x: 0, y: 12 } as never);
    run(e, (x) => x.phase !== 'sliding');
    expect(c.state).toBe('off_the_back');
    expect(e.roundKilled).toEqual([false, false]);
  });
});

describe('knockouts', () => {
  it('a throw can knock a settled cube off the back of the table', () => {
    const { e } = newMatch();
    const red = e.liveCube!;
    e.launch(0, -1, 0.5);
    run(e, (x) => x.phase !== 'sliding');
    teleport(red, 0, yIceFar() + 1);
    run(e, (x) => x.phase === 'aiming');
    // Blue fires straight down the middle at full power.
    e.launch(0, -1, 1);
    run(e, (x) => x.phase !== 'sliding');
    expect(red.state).toBe('off_the_back');
  });
});
