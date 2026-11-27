import { config } from '../game/config';
import type { GameMode } from '../game/mode';
import { defaultMode } from '../game/mode';

/**
 * The in-game rulebook, as data. It reads its numbers from the match's
 * `GameMode` so the text stays true for every mode, and it has no React dependency so
 * it can be tested headlessly.
 */
export interface RulebookSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export function rulebook(
  mode: Readonly<GameMode> = defaultMode
): RulebookSection[] {
  const [red, blue] = config.teamNames;
  const target = mode.targetScore;
  const cubes = mode.cubesPerRound;
  const charges = mode.windChargesPerThrow;
  const chargeWord = charges === 1 ? 'wind charge' : 'wind charges';

  return [
    {
      id: 'goal',
      title: 'The game',
      paragraphs: [
        `Two teams, ${red} and ${blue}, take turns sliding sulphur cubes down a sheet of ice. Land your cubes as far forward as you can without sliding off the far end.`,
        `Each team has ${cubes} cubes per round. The teams alternate throws, and the team that throws first swaps every round.`,
      ],
    },
    {
      id: 'lining-up',
      title: 'Lining up',
      paragraphs: [
        'Both teams throw from the wooden platform at the bottom of the rink. Before you throw, drag on the platform to slide your cube left or right along the starting line.',
      ],
    },
    {
      id: 'throwing',
      title: 'Throwing',
      paragraphs: [
        'Touch the ice above the starting line, pull back, and let go. The further you pull, the harder the throw. The aim line shows the direction and the power.',
        'Your cube can knock other cubes around. Knock an opposing cube off the far end and it scores nothing this round.',
      ],
    },
    {
      id: 'defending',
      title: 'Defending with wind charges',
      paragraphs: [
        `While the other team's cube is sliding, tap anywhere to fire a wind charge from the nearest dispenser in the side wall. You get up to ${charges} ${chargeWord} per throw.`,
        'A charge takes time to cross the ice, so timing is everything. Its blast pushes every cube nearby.',
        'If a blast pushes the thrown cube backwards, that cube is worth -1 point to its team instead of whatever it would have scored.',
      ],
    },
    {
      id: 'scoring',
      title: 'Scoring',
      paragraphs: [
        'When every cube has been thrown, the round is scored. The far end has three bands worth 1, 2 and 3 points, with 3 nearest the edge.',
        'A cube counts for a band if even a single pixel touches it. A cube touching two bands takes the higher one.',
        'A cube hanging over the back edge without falling off is worth 4. A cube that slides off the end is out and scores 0.',
        "Only the team holding the front scores. Each of its cubes that sits ahead of the other team's best cube scores its points. The other team scores nothing, apart from any -1 penalties.",
      ],
    },
    {
      id: 'round-killer',
      title: 'The Round Killer',
      paragraphs: [
        'If a wind charge sends the thrown cube all the way back onto the wooden platform behind the starting line, that team loses the rest of its throws for the round.',
        'The other team then finishes its remaining throws at its own pace.',
      ],
    },
    {
      id: 'winning',
      title: 'Winning',
      paragraphs: [
        `The first team to reach ${target} points, with all its lights lit up, wins the game. If both teams pass ${target} in the same round, the higher total wins. A team's total never drops below 0.`,
        'The winners get bragging rights, and the losers must reset all the lights and sulphur cubes.',
        'Eyes Out Ray Finkle!',
      ],
    },
  ];
}
