/**
 * Match engine: physics (planck), turn loop, wind charges and the win
 * condition.
 *
 * Framework-free on purpose: the React/Skia layer only calls the public
 * methods, calls `update(dt)` every frame and reads the public state.
 */
import type { Body } from 'planck';
import { Box, Vec2, World } from 'planck';

import {
  config,
  dampAt,
  dispensers,
  halfWidth,
  yBoardEnd,
  yIceFar,
  yIceNear,
} from './config';
import type { CubeState, RoundResult } from './scoring';
import { scoreRound } from './scoring';

export type Phase =
  'aiming' | 'sliding' | 'resolving' | 'round_break' | 'game_over';

export interface Cube {
  id: number;
  team: number;
  state: CubeState;
  knockedBack: boolean;
  body: Body;
  slowFor: number;
  // Mirrors of the body, refreshed every step so render/scoring read plain data.
  x: number;
  y: number;
  angle: number;
  forwardEdgeY: number;
}

export interface WindCharge {
  x: number;
  y: number;
  dx: number;
  dy: number;
  travelled: number;
  exploded: boolean;
  /** Seconds of blast flash left. */
  flash: number;
  blastX: number;
  blastY: number;
}

const FIXED_DT = 1 / 120;
const BLAST_FLASH = 0.22;
const HALF = 0.5;

export type EngineEvent =
  | { type: 'state' } // anything the HUD should re-read
  | { type: 'message'; text: string; seconds: number }
  | { type: 'round_ended'; result: RoundResult; round: number }
  | { type: 'game_over'; winner: number };

type Listener = (event: EngineEvent) => void;

export class GameEngine {
  phase: Phase = 'aiming';
  scores: [number, number] = [0, 0];
  roundIndex = 0;
  firstShooter = 0;
  currentTeam = 0;
  shotsLeft: [number, number] = [0, 0];
  roundKilled: [boolean, boolean] = [false, false];
  windChargesLeft = 0;
  cubes: Cube[] = [];
  charges: WindCharge[] = [];
  liveCube: Cube | null = null;
  lastResult: RoundResult | null = null;
  winner = -1;

  private world: World;
  private nextId = 0;
  private acc = 0;
  private slideTime = 0;
  private timers: { at: number; fn: () => void }[] = [];
  private clock = 0;
  private listeners = new Set<Listener>();

  constructor() {
    this.world = this.buildWorld();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: EngineEvent) {
    this.listeners.forEach((listener) => listener(event));
  }

  private buildWorld(): World {
    const world = new World({ gravity: Vec2(0, 0) });
    // Side walls run the whole length of the board. The ends are open: a cube
    // that crosses them leaves play.
    const hw = halfWidth();
    const len = yBoardEnd();
    const thick = 2;
    for (const side of [-1, 1]) {
      const wall = world.createBody({
        type: 'static',
        position: Vec2(side * (hw + thick / 2), len / 2),
      });
      wall.createFixture({
        shape: new Box(thick / 2, len / 2 + 5),
        friction: 0,
        restitution: config.wallBounce,
      });
    }
    return world;
  }

  // -------------------------------------------------------------------------
  // Match / round flow
  // -------------------------------------------------------------------------

  startMatch() {
    this.scores = [0, 0];
    this.roundIndex = 0;
    this.firstShooter = 0;
    this.winner = -1;
    this.timers = [];
    this.startRound();
  }

  restart() {
    this.startMatch();
  }

  private startRound() {
    this.clearCubes();
    this.shotsLeft = [config.cubesPerRound, config.cubesPerRound];
    this.roundKilled = [false, false];
    this.lastResult = null;
    this.beginTurn(this.firstShooter);
  }

  private beginTurn(team: number) {
    this.currentTeam = team;
    this.phase = 'aiming';
    this.windChargesLeft = config.windChargesPerThrow;
    this.slideTime = 0;

    const body = this.world.createBody({
      type: 'dynamic',
      position: Vec2(0, yIceNear() - HALF),
      angularDamping: config.angularDamp,
      bullet: true,
    });
    body.createFixture({
      shape: new Box(HALF, HALF),
      density: 1,
      friction: 0,
      restitution: config.cubeBounce,
    });
    body.setAwake(false);

    const cube: Cube = {
      id: this.nextId++,
      team,
      state: 'racked',
      knockedBack: false,
      body,
      slowFor: 0,
      x: 0,
      y: yIceNear() - HALF,
      angle: 0,
      forwardEdgeY: yIceNear() - 2 * HALF,
    };
    this.cubes.push(cube);
    this.liveCube = cube;
    this.sync(cube);
    this.emit({ type: 'state' });
  }

  private advanceTurn() {
    const other = 1 - this.currentTeam;
    if (this.canThrow(other)) this.beginTurn(other);
    else if (this.canThrow(this.currentTeam)) this.beginTurn(this.currentTeam);
    else this.endRound();
  }

  private canThrow(team: number) {
    return this.shotsLeft[team] > 0 && !this.roundKilled[team];
  }

  private endRound() {
    this.phase = 'round_break';
    const result = scoreRound(this.cubes);
    this.lastResult = result;

    for (const team of [0, 1]) {
      this.scores[team] += result.points[team];
      if (!config.allowNegativeMatchScore) {
        this.scores[team] = Math.max(0, this.scores[team]);
      }
    }
    this.emit({ type: 'round_ended', result, round: this.roundIndex });

    const winner = this.findWinner();
    if (winner !== -1) {
      this.phase = 'game_over';
      this.winner = winner;
      this.emit({ type: 'game_over', winner });
      this.emit({ type: 'state' });
      return;
    }

    this.roundIndex += 1;
    if (config.alternateFirstShooter) this.firstShooter = 1 - this.firstShooter;
    this.after(config.roundBreakDelay, () => {
      if (this.phase === 'round_break') this.startRound();
    });
    this.emit({ type: 'state' });
  }

  private findWinner(): number {
    const reached = [0, 1].filter(
      (team) => this.scores[team] >= config.targetScore
    );
    if (reached.length === 0) return -1;
    if (reached.length === 1) return reached[0];
    // Both crossed the line in the same round — the higher total takes it.
    return this.scores[0] >= this.scores[1] ? 0 : 1;
  }

  private clearCubes() {
    for (const cube of this.cubes) this.world.destroyBody(cube.body);
    this.cubes = [];
    this.charges = [];
    this.liveCube = null;
  }

  // -------------------------------------------------------------------------
  // Throwing
  // -------------------------------------------------------------------------

  canAim() {
    return this.phase === 'aiming' && this.liveCube !== null;
  }

  /** Slide the racked cube along the starting line. */
  placeCubeAtX(targetX: number) {
    if (!this.canAim() || !this.liveCube) return;
    const limit = halfWidth() - 0.6;
    const px = Math.max(-limit, Math.min(limit, targetX));
    this.liveCube.body.setPosition(Vec2(px, yIceNear() - HALF));
    this.sync(this.liveCube);
  }

  /** `dx, dy` unit direction, `power` 0..1. */
  launch(dx: number, dy: number, power: number) {
    const cube = this.liveCube;
    if (!this.canAim() || !cube) return;
    this.phase = 'sliding';
    this.slideTime = 0;
    cube.state = 'live';
    cube.slowFor = 0;
    const clampedPower = Math.max(0, Math.min(1, power));
    const speed =
      config.launchSpeedMin +
      (config.launchSpeedMax - config.launchSpeedMin) * clampedPower;
    cube.body.setAwake(true);
    cube.body.setLinearVelocity(Vec2(dx * speed, dy * speed));
    this.emit({ type: 'state' });
  }

  // -------------------------------------------------------------------------
  // Wind charges
  // -------------------------------------------------------------------------

  get defendingTeam() {
    return 1 - this.currentTeam;
  }

  canFireWindCharge() {
    return this.phase === 'sliding' && this.windChargesLeft > 0;
  }

  /** Fire the dispenser closest to a world point. */
  fireWindChargeNear(wx: number, wy: number): boolean {
    if (!this.canFireWindCharge()) return false;
    let best = null as ReturnType<typeof dispensers>[number] | null;
    let bestD = Infinity;
    for (const dispenser of dispensers()) {
      const dist = Math.hypot(dispenser.x - wx, dispenser.y - wy);
      if (dist < bestD) {
        bestD = dist;
        best = dispenser;
      }
    }
    if (!best) return false;
    this.charges.push({
      x: best.x,
      y: best.y,
      dx: best.nx,
      dy: best.ny,
      travelled: 0,
      exploded: false,
      flash: 0,
      blastX: 0,
      blastY: 0,
    });
    this.windChargesLeft -= 1;
    this.emit({ type: 'state' });
    return true;
  }

  private stepCharges(dt: number) {
    for (const charge of this.charges) {
      if (charge.exploded) {
        charge.flash -= dt;
        continue;
      }
      const step = config.windTravelSpeed * dt;
      charge.x += charge.dx * step;
      charge.y += charge.dy * step;
      charge.travelled += step;

      const hit = this.cubes.some(
        (cube) =>
          this.isOnBoard(cube) &&
          Math.hypot(cube.x - charge.x, cube.y - charge.y) <
            config.windTriggerDistance
      );
      if (hit || charge.travelled >= config.windMaxTravel) {
        this.detonate(charge);
      }
    }
    this.charges = this.charges.filter(
      (charge) => !charge.exploded || charge.flash > 0
    );
  }

  private detonate(charge: WindCharge) {
    charge.exploded = true;
    charge.flash = BLAST_FLASH;
    charge.blastX = charge.x;
    charge.blastY = charge.y;
    const radius = config.windBlastRadius;

    for (const cube of this.cubes) {
      if (!this.isOnBoard(cube)) continue;
      const ox = cube.x - charge.x;
      const oy = cube.y - charge.y;
      const dist = Math.hypot(ox, oy);
      if (dist > radius) continue;

      // Directly away from ground zero; a cube dead on top gets pushed along
      // the charge's own heading instead of nowhere.
      const ax = dist > 0.01 ? ox / dist : charge.dx;
      const ay = dist > 0.01 ? oy / dist : charge.dy;
      const impulse = config.windBlastImpulse * (1 - dist / radius);

      this.disturb(cube);
      cube.body.applyLinearImpulse(
        Vec2(ax * impulse, ay * impulse),
        cube.body.getWorldCenter(),
        true
      );

      // +Y is backwards (towards the shooter's own platform): a push that
      // leaves the thrown cube heading that way costs the throw a point.
      // Only the cube being thrown can earn the penalty (docs/decisions.md D-15);
      // anything else the blast catches is just moved.
      if (
        cube === this.liveCube &&
        cube.body.getLinearVelocity().y > config.windBackwardPenaltySpeed
      ) {
        cube.knockedBack = true;
      }
    }
    this.emit({ type: 'state' });
  }

  // -------------------------------------------------------------------------
  // Cube state
  // -------------------------------------------------------------------------

  isOnBoard(cube: Cube) {
    return (
      cube.state === 'racked' ||
      cube.state === 'live' ||
      cube.state === 'settled'
    );
  }

  private disturb(cube: Cube) {
    if (cube.state === 'settled') {
      cube.state = 'live';
      cube.slowFor = 0;
      cube.body.setAwake(true);
    }
  }

  private sync(cube: Cube) {
    const position = cube.body.getPosition();
    cube.x = position.x;
    cube.y = position.y;
    cube.angle = cube.body.getAngle();
    const extent =
      HALF * (Math.abs(Math.cos(cube.angle)) + Math.abs(Math.sin(cube.angle)));
    cube.forwardEdgeY = cube.y - extent;
  }

  private stepCube(cube: Cube, dt: number) {
    if (cube.state === 'racked' || !this.isOnBoard(cube)) return;
    const velocity = cube.body.getLinearVelocity();
    const speed = Math.hypot(velocity.x, velocity.y);

    // A cube at rest can still be barged by a later throw (takeout shot).
    if (cube.state === 'settled') {
      if (speed > config.stopSpeed) {
        cube.state = 'live';
        cube.slowFor = 0;
      } else {
        return;
      }
    }

    cube.body.setLinearDamping(dampAt(cube.y));

    // Centre of mass past the far edge of the ice: it tips over and drops.
    if (cube.y < yIceFar()) {
      this.leaveBoard(cube, 'off_the_back', 'off_the_back');
      return;
    }

    // All the way back onto the shooter's own platform: every part of the
    // cube is behind the starting line (docs/decisions.md D-16).
    if (cube.forwardEdgeY > yIceNear()) {
      if (cube.knockedBack) {
        this.leaveBoard(cube, 'killed_back', 'round_killer');
      } else this.leaveBoard(cube, 'off_the_back', 'off_the_back'); // D-06: no penalty
      return;
    }

    if (speed < config.stopSpeed) {
      cube.slowFor += dt;
      if (cube.slowFor >= config.stopTime) this.settle(cube);
    } else {
      cube.slowFor = 0;
    }
  }

  private settle(cube: Cube) {
    cube.state = 'settled';
    cube.body.setLinearVelocity(Vec2(0, 0));
    cube.body.setAngularVelocity(0);
  }

  private leaveBoard(cube: Cube, state: CubeState, reason: string) {
    cube.state = state;
    cube.body.setLinearVelocity(Vec2(0, 0));
    cube.body.setActive(false);

    if (reason === 'round_killer') {
      const team = cube.team;
      this.roundKilled[team] = true;
      this.shotsLeft[team] = 0;
      this.emit({
        type: 'message',
        text: `THE ROUND KILLER!\n${config.teamNames[team]} loses the rest of the round.`,
        seconds: 3,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Frame loop
  // -------------------------------------------------------------------------

  private after(seconds: number, fn: () => void) {
    this.timers.push({ at: this.clock + seconds, fn });
  }

  /** Advance by `dt` real seconds, in fixed physics steps. */
  update(dt: number) {
    this.acc += Math.min(dt, 0.1);
    while (this.acc >= FIXED_DT) {
      this.acc -= FIXED_DT;
      this.step(FIXED_DT);
    }
  }

  private step(dt: number) {
    this.clock += dt;
    this.world.step(dt, 8, 3);
    for (const cube of this.cubes) {
      if (this.isOnBoard(cube)) this.sync(cube);
    }
    for (const cube of this.cubes) this.stepCube(cube, dt);
    this.stepCharges(dt);

    if (this.phase === 'sliding') {
      this.slideTime += dt;
      if (this.slideTime > config.maxSlideSeconds) {
        for (const cube of this.cubes) {
          if (cube.state === 'live') this.settle(cube);
        }
      }
      if (this.boardIsStill()) this.resolveThrow();
    }

    if (this.timers.length) {
      const due = this.timers.filter((timer) => timer.at <= this.clock);
      this.timers = this.timers.filter((timer) => timer.at > this.clock);
      due.forEach((timer) => timer.fn());
    }
  }

  private boardIsStill() {
    return !this.cubes.some((cube) => cube.state === 'live');
  }

  private resolveThrow() {
    this.phase = 'resolving';
    this.shotsLeft[this.currentTeam] = Math.max(
      0,
      this.shotsLeft[this.currentTeam] - 1
    );
    this.liveCube = null;
    this.emit({ type: 'state' });
    this.after(config.resolveDelay, () => {
      if (this.phase === 'resolving') this.advanceTurn();
    });
  }
}
