import type { GameMode } from '../game/mode';

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/** One line describing a mode's rules, for the mode picker. */
export function modeSummary(mode: Readonly<GameMode>): string {
  return [
    `${plural(mode.cubesPerRound, 'cube', 'cubes')} each`,
    `first to ${mode.targetScore}`,
    plural(mode.windChargesPerThrow, 'wind charge', 'wind charges'),
  ].join(', ');
}

/** A short pitch for each preset, by id. */
export const modeTaglines: Record<string, string> = {
  quick: 'A short match for a few minutes.',
  classic: 'The rulebook rules.',
  chaotic: 'More wind charges and stronger blasts.',
  custom: 'Set your own rules.',
};
