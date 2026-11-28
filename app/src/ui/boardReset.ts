/**
 * Score pairs for the "loser resets the board" animation after a match: on
 * each step every lit score light goes out one by one, from the top, until
 * both teams are back to zero. The rulebook's joke is that the losing team
 * has to reset all the lights and cubes for the next game.
 */
export function boardResetSteps(
  scores: readonly [number, number]
): [number, number][] {
  const steps: [number, number][] = [];
  let [redScore, blueScore] = scores.map((score) => Math.max(0, score));
  while (redScore > 0 || blueScore > 0) {
    redScore = Math.max(0, redScore - 1);
    blueScore = Math.max(0, blueScore - 1);
    steps.push([redScore, blueScore]);
  }
  return steps;
}
