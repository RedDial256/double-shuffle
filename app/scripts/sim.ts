import { GameEngine } from '../src/game/engine';
const engine = new GameEngine();
engine.subscribe((ev) => {
  if (ev.type !== 'state') {
    console.log(ev.type === 'round_ended' ? ev.result.summary : ev.type);
  }
});
engine.startMatch();
let elapsedSeconds = 0;
for (
  let frameIndex = 0;
  frameIndex < 60 * 600 && engine.phase !== 'game_over';
  frameIndex++
) {
  if (engine.phase === 'aiming') {
    const power = 0.45 + Math.random() * 0.2;
    engine.launch(0, -1, power);
    const cube = engine.liveCube!;
    console.log(
      `t=${elapsedSeconds.toFixed(1)} round ${engine.roundIndex} team ${engine.currentTeam} power ${power.toFixed(2)}`
    );
  }
  engine.update(1 / 60);
  elapsedSeconds += 1 / 60;
}
console.log(
  'final',
  engine.scores,
  engine.phase,
  'time',
  elapsedSeconds.toFixed(0)
);
