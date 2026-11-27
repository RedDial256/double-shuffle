import { GameEngine } from '../src/game/engine';
const e = new GameEngine();
e.subscribe((ev) => {
  if (ev.type !== 'state') {
    console.log(ev.type === 'round_ended' ? ev.result.summary : ev.type);
  }
});
e.startMatch();
let t = 0;
for (let i = 0; i < 60 * 600 && e.phase !== 'game_over'; i++) {
  if (e.phase === 'aiming') {
    const p = 0.45 + Math.random() * 0.2;
    e.launch(0, -1, p);
    const c = e.liveCube!;
    console.log(
      `t=${t.toFixed(1)} round ${e.roundIndex} team ${e.currentTeam} power ${p.toFixed(2)}`
    );
  }
  e.update(1 / 60);
  t += 1 / 60;
}
console.log('final', e.scores, e.phase, 'time', t.toFixed(0));
