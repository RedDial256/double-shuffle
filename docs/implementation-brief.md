# Double Shuffle — Implementation Brief

This is a handoff document for whoever (human or agent) implements the game next, in a separate Claude Code session. It's a companion to `docs/game-design.md`, not a replacement — **read that first** for the full ruleset, board measurements, and scoring rules. This document covers what that one doesn't: scope boundaries, environment/tech setup, conventions, and a suggested build order.

## 1. Read First

- `docs/game-design.md` — the full ruleset for the Original version: concept, board layout & measurements, turn structure, scoring zones, wind-charge defense, knockouts, win condition, visual direction, camera decision. Treat it as the spec.
- Its **Section 11 ("Scope & Deferred Features")** lists what's explicitly *not* part of this build: RNG bumpers, the 3rd-person "puck cam", and the second ruleset variant. Don't implement these — a hook/stub is fine if it costs nothing, but don't spend time building for features that don't exist yet.

## 2. Scope for This Implementation Pass

**In scope:**
- The Original ruleset in full (turn structure, 3 scoring zones + edge/4-point overhang, the "qualified points" contact rule, wind-charge defense with 360° radial impulse physics, knockout shots, the Round Killer rule, first-to-15 win condition).
- 2D top-down camera/view.
- Two local players, pass-and-play on one device. Nothing in the design doc implies online multiplayer — don't build for it unless the user asks.
- Android + iOS as export targets.

**Out of scope (don't build):** RNG bumpers, 3rd-person camera mode, the ruleset variant, online multiplayer, monetization/store integration.

## 3. Tech Stack (already decided)

- **App: React Native with Expo** (see `app/package.json` for the SDK version). Expo changes APIs between SDK releases, so read `app/AGENTS.md` and check the docs for the installed SDK version before touching Expo or React Native APIs.
- **Language: TypeScript**, strict mode.
- **Rendering**: `@shopify/react-native-skia`. **Animation**: `react-native-reanimated` (with `react-native-worklets`). **Physics**: `planck`.
- **Export targets**: Android and iOS, built with EAS (`npx eas-cli@latest build`). Native `android/` and `ios/` folders are generated; configure native behaviour in `app/app.json`, never by hand.
- Add dependencies with `npx expo install <package>` so versions match the SDK. Libraries with native code need a development build, since Expo Go only ships its bundled modules.
- History: this stack replaced an earlier engine-based build. See `docs/decisions.md` D-14.

## 4. Project & Repo Conventions

- Project root: this folder, `double-shuffle/`, on the user's machine (`C:\Users\giodo\Desktop\double-shuffle` on Windows). The Expo app lives in `app/`.
- No GitHub repository exists yet. Commit early and often once one does; confirm with the user first if unsure about workflow preferences.
- **Language: everything in English** — code, comments, component names, in-game UI text, commit messages. This holds even though the design conversation that produced `game-design.md` was in Portuguese; the user was explicit that the game itself should be English-only.
- Code layout:
  ```
  double-shuffle/
    docs/              # design docs, keep as-is
    assets/            # sprites/, audio/, fonts/ for game art (empty for now)
    app/
      App.tsx          # entry point
      app.json         # Expo config
      scripts/sim.ts   # headless match simulation
      src/
        game/          # framework-free logic: config.ts, scoring.ts, engine.ts
        ui/            # React/Skia layer: Board.tsx, useAim.ts, Hud.tsx
  ```
- Keep `src/game/` free of React and React Native imports. The UI layer calls the engine's public methods, calls `update(dt)` every frame, and reads its state. That's what lets `sim.ts` and unit tests run the game without a device.
- Every tunable number goes in `app/src/game/config.ts`, never inline in the engine or UI.
- Run `npx tsc --noEmit` (and `npx expo lint`) from `app/` before calling a change done.
- The reference images already sitting in the project root (`top view.png`, `front view.png`, the `regras-*.webp` / `page-*.jpg` rulebook captures) are **research references only** — screenshots someone else took of a Minecraft build. They're for measurements and style reference, not game assets. Leave them where they are; don't bundle them into the app.

## 5. Art & Assets — IP Note

The reference screenshots come from an actual Minecraft server build, and Minecraft's textures and assets belong to Mojang/Microsoft. **Do not extract, trace, or reuse real Minecraft textures in the game.** The brief is a blocky/voxel-*inspired* original art style — flat-shaded cubes, chunky pixel textures, similar visual language — built from scratch. No game art exists yet. Plain colored-rectangle placeholders are a fine first pass while the physics prototype comes together; real art is a later pass.

## 6. Suggested Build Order

Physics-and-feel first, since the core fun of this game *is* the shuffleboard mechanic — get that right before anything else matters:

1. **Rink + physics prototype**: static 2D board sized per the `game-design.md` Section 3 measurements (15-wide rink, per-zone stone-vs-ice friction), one cube, a spear-throw input (e.g., drag/flick or power+angle), sliding physics, out-of-bounds detection.
2. **Scoring zones**: the qualified-points contact rule and the 4-point overhang rule (game-design.md Section 5); a debug score readout.
3. **Second cube + knockout physics**: cube-on-cube collisions, "furthest-forward cube scores" comparison logic.
4. **Wind charges**: fixed per-zone dispensers, 2-per-throw limit, 360° radial knockback impulse, the -1 backward penalty, the Round Killer condition.
5. **Turn loop + win condition**: alternating turns, 4 cubes/side default, first to 15 points, "lights" score UI.
6. **Polish pass**: original Minecraft-inspired art, book-style UI for rules/menus (per game-design.md Section 9), sound/haptics.

## 7. Known Open Questions

Carried over from `game-design.md` Section 13 — not blocking enough to stall design, but implementation will hit them concretely. Where the user isn't available to answer right away, make a reasonable placeholder choice, note it clearly (code comment or a running decisions log), and flag it back rather than guessing silently and moving on:

- Whether the rink is symmetric end-to-end (implying ~80×15 blocks total) — affects overall board size.
- Exact rounds-per-match / cubes-per-round default for pacing (both are meant to be tunable, but the prototype needs *some* starting default).
- Exact wind-charge dispenser activation input (simple tap/button per dispenser vs. some timing window).
- Whether a knockout shot can also trigger the Round Killer or the -1 penalty.
- Who shoots first each round — fixed, or alternating.

## 8. Practical Notes

- The user has React Native experience, so standard React Native and Expo patterns need no explanation. Game-specific ideas (fixed-timestep physics, Box2D bodies and impulses, Skia drawing, Reanimated shared values) may be newer, so explain those as they come up.
- App package/bundle identifiers (e.g., `com.<name>.doubleshuffle`) and store metadata (display name capitalization, icon, etc.) haven't been decided — ask before setting them in `app/app.json` or running a store build.
