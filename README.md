# Double Shuffle

A two-player shuffleboard-on-ice game for Android and iOS, built with React
Native and Expo, drawn with React Native Skia, and simulated with planck.js.
Inspired by "Shuffled to Bits", the Hermitcraft season 11 minigame built by
Skizzleman and ImpulseSV.

Design notes live in [`docs/game-design.md`](docs/game-design.md), scope and
conventions in [`docs/implementation-brief.md`](docs/implementation-brief.md),
and every judgement call made during implementation in
[`docs/decisions.md`](docs/decisions.md), and the plan to v1 in
[`docs/roadmap.md`](docs/roadmap.md).

## Stack

* **Expo SDK 58 / React Native 0.88**, TypeScript, strict mode.
* **@shopify/react-native-skia** draws the rink, cubes, wind charges and the aim
  line on a single canvas.
* **react-native-reanimated** (with `react-native-worklets`) carries per-frame
  cube and charge positions to the canvas as shared values, so React doesn't
  re-render every frame.
* **planck** (a JavaScript port of Box2D) handles the 2D physics: sliding,
  wall and cube collisions, and the wind-charge impulses.

## Running it

You need Node.js (LTS) and either the Expo Go app on a phone or an
Android/iOS emulator.

```sh
cd app
npm install
npx expo start
```

Then scan the QR code with Expo Go, or press `a` (Android emulator) or `i`
(iOS simulator) in the terminal.

`npm run web` also works for quick tuning in a browser, with the mouse
standing in for touch. It first copies Skia's `canvaskit.wasm` into
`app/public/` (git-ignored), which the web build needs to draw.

Before calling a change done, run `npm run typecheck` and `npm test` from
`app/`. The unit tests in `app/src/game/__tests__/` cover the scoring rules and
the engine (throws, turns, rounds, wind charges, the Round Killer, knockouts and
the win condition) without a device.

`app/scripts/sim.ts` plays a whole match headlessly with random throws and
prints the round summaries, which is handy for checking pacing after changing
the numbers (run it with any TypeScript runner, for example
`npm run sim`).

## How to play

Two players share one device and take turns.

* **Line up**: drag on the wood platform below the starting line to slide your
  cube sideways.
* **Throw**: pull back anywhere on the ice and release. The cube goes the
  opposite way to your drag, and the further you pull the harder it goes. The
  dashed line doubles as the power meter.
* **Defend**: while the other team's cube is sliding, tap anywhere on the ice.
  The wind-charge dispenser nearest your tap fires a burst straight across.
  Two per throw. Time it so the burst lands *ahead* of the cube and the
  knockback shoves it backwards, which costs them a point. If it drives the
  cube all the way back onto the platform, that's the Round Killer and they
  lose the rest of the round.
* **Score**: the bands at the far end are worth 1, 2 and 3 going deeper, and a
  cube left hanging over the back edge without falling is worth 4. Only one
  team scores per round: whoever holds the furthest-forward cube takes points
  for every cube of theirs ahead of the opposition's best. First to 15 wins.

## Layout

```
README.md
docs/                  design spec, implementation brief, decisions log
assets/                audio/, fonts/, sprites/ (empty for now)
*.png, *.jpg, *.webp   research references (see note below)
app/                   the Expo app
  App.tsx              entry point: creates the engine, mounts Board and Hud
  index.ts             registers App with Expo
  app.json             Expo config (name, icons, orientation)
  assets/              app icon and splash images
  scripts/
    sim.ts             headless match simulation
  src/
    game/              framework-free game logic, no React imports
      config.ts        board geometry, colours, timings and shared physics
      mode.ts          GameMode: per-match rules, and the Classic mode
      scoring.ts       pure scoring functions
      engine.ts        physics world, turns, rounds, wind charges, win condition
    ui/
      Board.tsx        Skia canvas: draws the rink and runs the frame loop
      useAim.ts        all touch input: line up, pull-back throw, wind charges
      Hud.tsx          score lights, turn banner, round summary
```

The split is deliberate: everything under `src/game/` can run without React
(that's how `sim.ts` works), and the UI layer only calls the engine's public
methods, calls `update(dt)` every frame, and reads its state.

## Tuning

Almost everything worth changing is in `app/src/game/config.ts`, and the board
re-lays itself from those numbers: rink proportions, per-surface friction,
throw power, wind-charge reach, colours. The per-match rules (target score,
cubes per round, wind charges per throw, wind strength) are a `GameMode` in
`app/src/game/mode.ts`, passed to `engine.startMatch()`. Distances are in blocks (one block is one cube across, and one metre
in the physics world), and speeds are in blocks per second.

Two that matter most for feel:

* `dampIce` and `launchSpeedMax` together decide how far a throw carries.
  Under exponential damping a cube coasts roughly `speed / damp` blocks, and
  they're currently set so that full power just overshoots the back edge.
* `windTravelSpeed` is the difficulty knob for defending. Lower gives the
  defender more lead time to read the slide.

## Still to do

The core loop (rink and physics, scoring zones, knockouts, wind charges, turn
loop and win condition) and a first cut of the HUD are in place. What's left:

* **Rules screen.** There's no in-game rulebook yet.
* **Tests.** No unit tests for `scoring.ts` or `engine.ts` yet.
* **Art.** Everything is coloured rectangles. Original blocky/voxel art, drawn
  from scratch, with no Minecraft textures, per the brief's IP note.
* **Sound and haptics.**
* **Store identity.** The package/bundle identifier
  (`com.<something>.doubleshuffle`) and final icons haven't been decided, and
  the brief says to ask first.
* **Balance.** The physics numbers are reasoned, not playtested. Expect to move
  them.

Explicitly out of scope and not built, per the brief: RNG bumpers, the
3rd-person puck cam, the second ruleset variant, online multiplayer.

## Note on the reference images

`top view.png`, `front view.png` and the `regras-*` / `page-*` captures in the
project root are research references: screenshots of a Minecraft build. They
are not bundled into the app and nothing in the game is traced from them.
