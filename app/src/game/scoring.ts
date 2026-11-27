/**
 * Pure functions that turn a board full of settled cubes into a round score.
 * See docs/decisions.md D-03..D-05 for the rules being implemented.
 */
import { config, yIceFar } from './config';

export type CubeState =
  'racked' | 'live' | 'settled' | 'off_the_back' | 'killed_back';

/** The slice of a cube that scoring needs. */
export interface ScorableCube {
  team: number;
  state: CubeState;
  knockedBack: boolean;
  /** Y of the cube's furthest-forward point, rotation included. */
  forwardEdgeY: number;
}

export const isOnBoard = (cube: ScorableCube) =>
  cube.state === 'racked' || cube.state === 'live' || cube.state === 'settled';

/** Points a cube is worth on its own, ignoring who leads. 0 = no band. */
export function zoneValue(cube: ScorableCube): number {
  if (!isOnBoard(cube)) return 0;
  const lead = cube.forwardEdgeY;
  const far = yIceFar();

  // Any part hanging over the back of the table, centre still on the ice.
  if (lead < far) return 4;

  const depth = lead - far;
  if (depth < config.band) return 3;
  if (depth < config.band * 2) return 2;
  if (depth < config.band * 3) return 1;
  return 0;
}

export interface RoundResult {
  points: [number, number];
  /** Team holding the furthest cube, or -1. */
  leader: number;
  penalties: [number, number];
  /** Cubes that scored for the leader. */
  scoring: ScorableCube[];
  /** Points each cube in `scoring` earned, in the same order. */
  scoringValues: number[];
  summary: string;
}

export function scoreRound(cubes: ScorableCube[]): RoundResult {
  const points: [number, number] = [0, 0];
  const penalties: [number, number] = [0, 0];
  const scoring: ScorableCube[] = [];
  const scoringValues: number[] = [];
  const contenders: ScorableCube[] = [];

  for (const cube of cubes) {
    if (!isOnBoard(cube)) continue;
    if (cube.knockedBack) {
      penalties[cube.team] += 1;
      continue; // a penalised cube can't also score
    }
    contenders.push(cube);
  }

  const best = [Infinity, Infinity];
  for (const cube of contenders) {
    best[cube.team] = Math.min(best[cube.team], cube.forwardEdgeY);
  }

  let leader = -1;
  if (best[0] < best[1]) leader = 0;
  else if (best[1] < best[0]) leader = 1;

  if (leader !== -1) {
    const rival = best[1 - leader];
    for (const cube of contenders) {
      if (cube.team !== leader) continue;
      if (cube.forwardEdgeY >= rival) continue; // behind their best cube
      const value = zoneValue(cube);
      if (value > 0) {
        points[leader] += value;
        scoring.push(cube);
        scoringValues.push(value);
      }
    }
  }

  points[0] -= penalties[0];
  points[1] -= penalties[1];

  return {
    points,
    leader,
    penalties,
    scoring,
    scoringValues,
    summary: summarise(points, penalties, leader),
  };
}

function summarise(
  points: [number, number],
  penalties: [number, number],
  leader: number
): string {
  const parts = [0, 1].map((team) => {
    const sign = points[team] >= 0 ? '+' : '';
    let line = `${config.teamNames[team]} ${sign}${points[team]}`;
    if (penalties[team] > 0) line += ` (${penalties[team]} windburst)`;
    return line;
  });
  const head =
    leader === -1 ? 'Blank end' : `${config.teamNames[leader]} holds`;
  return `${head} — ${parts.join(', ')}`;
}
