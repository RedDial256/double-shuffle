/**
 * Turns a `RoundResult` into the lines the end-of-round summary shows.
 * Pure so it can be tested without rendering anything.
 */
import { config } from './config';
import type { RoundResult } from './scoring';

export interface TeamSummary {
  team: number;
  name: string;
  /** Points from cubes, before penalties. */
  scored: number;
  /** Value of each scoring cube, highest first. */
  cubeValues: number[];
  /** Windburst penalties, one point each. */
  penalties: number;
  /** What the round adds to the match score (can be negative). */
  net: number;
  /** Match score after the round. */
  total: number;
}

export interface RoundSummary {
  /** 1-based round number. */
  round: number;
  headline: string;
  leader: number;
  teams: [TeamSummary, TeamSummary];
}

export function summariseRound(
  result: RoundResult,
  round: number,
  totals: [number, number]
): RoundSummary {
  const teams = [0, 1].map((team): TeamSummary => {
    const cubeValues =
      team === result.leader
        ? [...result.scoringValues].sort((a, b) => b - a)
        : [];
    return {
      team,
      name: config.teamNames[team],
      scored: cubeValues.reduce((sum, v) => sum + v, 0),
      cubeValues,
      penalties: result.penalties[team],
      net: result.points[team],
      total: totals[team],
    };
  }) as [TeamSummary, TeamSummary];

  const headline =
    result.leader === -1
      ? 'Blank end: nobody holds the front'
      : `${config.teamNames[result.leader]} holds the front`;

  return { round, headline, leader: result.leader, teams };
}

/** "3 + 2 = 5", "4", or "no cubes scored". */
export function describeCubes(t: TeamSummary): string {
  if (t.cubeValues.length === 0) return 'no cubes scored';
  if (t.cubeValues.length === 1) return `${t.scored} from 1 cube`;
  return `${t.cubeValues.join(' + ')} = ${t.scored}`;
}

export function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0';
}
