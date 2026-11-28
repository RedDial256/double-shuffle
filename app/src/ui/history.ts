/**
 * The History page text, as data (like `rulebook.ts`). Facts checked against
 * public sources (docs/decisions.md D-29); keep it text only, with no
 * Minecraft or Hermitcraft logos, skins, screenshots or textures.
 */
export interface HistorySection {
  id: string;
  title: string;
  paragraphs: string[];
}

export const history: readonly HistorySection[] = [
  {
    id: 'shuffleboard',
    title: 'Shuffleboard',
    paragraphs: [
      'Shuffleboard goes back to Tudor England. In the 1500s, long "shovelboard" tables stood in wealthy households, and Henry VIII was among the players.',
      'Passengers on ocean liners later played a version on deck, pushing discs with long cues. In 1913 the game came ashore at a hotel in Daytona Beach, Florida, and in 1924 St. Petersburg, Florida, founded what it calls the first club devoted only to shuffleboard.',
      'Today it is played on outdoor courts, on cruise ships and on long tables in bars.',
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring like curling',
    paragraphs: [
      'On a shuffleboard court, a disc scores by where it finishes: only a disc fully inside a numbered zone counts, and knocking the other side out of a good spot is half the game.',
      "Double Shuffle adds a rule from curling: only one team scores each round, the team with the cube furthest forward, and it scores for every cube ahead of the other team's best.",
    ],
  },
  {
    id: 'hermitcraft',
    title: 'Hermitcraft',
    paragraphs: [
      'Hermitcraft is a group of YouTubers who play together on a Minecraft server of the same name, started in 2012. Each season begins in a fresh world, where the members build bases, shops and games for each other.',
    ],
  },
  {
    id: 'shuffled-to-bits',
    title: 'Shuffled to Bits',
    paragraphs: [
      'In Hermitcraft Season 11, Skizzleman and ImpulseSV built "Shuffled to Bits": shuffleboard on ice, where teams slide blocks down a rink into scoring bands while the other team fights back with wind charges.',
      'Double Shuffle is a tribute to that game, rebuilt from its rulebook for two players on one phone.',
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    paragraphs: [
      'Original game: Skizzleman and ImpulseSV, on Hermitcraft Season 11.',
      'Double Shuffle is a fan tribute. It is not affiliated with or endorsed by Hermitcraft, Mojang or Microsoft. Minecraft is a trademark of Mojang. All of the art in this game is original.',
    ],
  },
];
