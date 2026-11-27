# Double Shuffle — Roadmap to v1

_Last updated: 2026-11-27_

This is the living plan for getting Double Shuffle to a solid v1. It sits next
to `game-design.md` (the rules), `implementation-brief.md` (scope and
conventions) and `decisions.md` (every judgement call, with reasons).

## Keeping this file current

* Update it in the same change that finishes a milestone item, closes or opens
  a decision, or changes scope. Bump the date above.
* Keep it short. Delete finished items and anything stale instead of
  striking them out; git history and the GitHub milestones keep the record.
  Reasoning behind a decision goes in `decisions.md`, not here.
* Each milestone maps to a GitHub milestone with the same name, and each
  bullet to one or more issues. If they disagree, fix whichever is wrong.

## Definition of a solid v1

v1 is ready when all of these are true:

1. A full pass-and-play match runs on physical Android and iOS devices with no
   crashes or blocking bugs.
2. The rules are covered by automated tests, including the rulebook's worked
   examples.
3. The physics is tuned by playtesting: a match takes 4 to 8 rounds, about 10
   to 15 minutes, at 60 fps on a mid-range Android phone.
4. Original art (voxel style, no Minecraft textures), sound and basic haptics.
5. A minimal app shell: Home, Game, Rules, Pause, Game over, Settings.
6. Signed EAS builds on Play internal testing and TestFlight.

**Out of v1:** RNG bumpers, puck cam, the ruleset variant, online play,
monetisation.

## Where we are

The React Native port covers the Original rules (D-01 to D-16), with unit
tests for scoring and the engine. The framework-free engine lives in
`app/src/game`, and the Skia board and HUD in `app/src/ui`. ESLint, Prettier,
commitlint, release-please and the rnsec security audit are set up.

Open work is tracked as GitHub issues, one milestone per section below.

**Missing:** Expo Router.

**Technical debt seen in the code:**

* The engine runs on the JS thread from `requestAnimationFrame` and copies a
  new array into a shared value every frame. Fine for now, but it needs
  measuring on a mid-range Android phone.
* Input uses the Responder system. `react-native-gesture-handler` is
  installed but unused.
* `CUBE_SLOTS` is fixed in `Board.tsx`, so changing `cubesPerRound` at
  runtime breaks rendering.
* The physics numbers have never been playtested.

## Decisions

| # | Decision | Status | Blocks |
|---|---|---|---|
| 1 | Both teams throw from the same end (D-01) | Decided: yes, as implemented | — |
| 2 | Navigation | Decided: Expo Router | — |
| 3 | Settings | Decided: 2 or 3 presets plus a Custom mode with a few options | — |
| 4 | Which presets, which Custom options | Decided: the M3 proposal below | — |
| 5 | Game loop on the JS thread or the UI thread | Decided: choose after measuring in M2 | M2 |
| 6 | Analytics tool | To investigate | M5 |
| 7 | Bundle ID, store name, icon | To investigate | M5 |
| 8 | Deploys | Decided: automatic internal EAS builds, with room for manual ones. Play internal testing and TestFlight only from M5 | M2 |
| 9 | Versioning | Decided: automated SemVer with release-please, 0.x → beta → rc → 1.0.0 (D-17) | — |

## Milestones

| Milestone | Depends on | Can run alongside |
|---|---|---|
| M0 Foundation | — | M1 |
| M1 Complete loop | — | M0 |
| M2 Feel and balance | M1 | M3 |
| M3 App shell | M1 | M2 |
| M4 Art, sound, haptics | M2 (stable proportions) | M3 |
| M5 Release | M3, M4 | — |

Art comes after balance on purpose: the rink proportions can still change
(D-02), and art made before then would need redoing.

### M0 — Foundation

* CI on GitHub Actions: `tsc --noEmit` and tests (ESLint, Prettier,
  commitlint and release-please already run on every PR and push to `main`).

**Done when:** `main` is green in CI, docs match the code, and 0.1.0 has been
released.

### M1 — Complete loop

* A test for both teams crossing the target score in the same round (the
  other rules cases are covered).
* Size the board's cube slots from the match, not a constant.

**Done when:** a full match plays on a device, at least as well as the Godot
version did, with the rules tested.

### M2 — Feel and balance

* Measure performance on a mid-range Android phone. Below 60 fps, move the
  loop to Reanimated's `useFrameCallback` or cut per-frame allocations.
* Move input to gesture-handler (Pan to aim and line up, Tap for wind
  charges).
* Debug panel for live tuning: `dampIce`, `launchSpeedMax`, `windTravelSpeed`,
  `windBlastImpulse`, `aimDragFullPowerPx`.
* Clearer aiming feedback: a readable power indicator and a visible "ready to
  throw" state.
* Automatic internal deploys in place (see Deploys), so playtests use real
  builds.
* At least 5 two-player playtest sessions, with findings logged in
  `decisions.md`.

**Done when:** playtest matches land at 10 to 15 minutes and nobody feels a
throw or wind charge was unfair.

### M3 — App shell

* Expo Router: Home, Game, Rules, Settings, and a Pause modal.
* Pause the engine when the app goes to the background (`AppState`).
* **Game modes as data.** `config` is a global constant today. It becomes a
  `GameMode` object handed to the engine at the start of each match (target
  score, cubes per round, wind charges per throw, and whichever physics
  numbers make sense). That serves the presets now and the rotating modes
  after v1 without rewriting the engine.
* **Presets:** Quick (fewer cubes, lower target), Classic (4 cubes, 15 points,
  the rulebook rules), and maybe Chaotic (more wind charges, a stronger
  blast).
* **Custom mode** with a few options, each with safe limits: target score,
  cubes per round, wind charges per throw, wind strength.
* Save the last mode, the Custom settings and the sound and haptics
  preferences on the device.
* Game over flow: rematch, back to Home, and the "loser resets the board"
  joke as an animation.

**Done when:** you can open the app, play, pause, change a setting and start
again without touching code.

### M4 — Art, sound, haptics

* Original voxel art drawn from scratch: cubes, ice, walls, dispensers, wood
  platform.
* Book-style UI for Rules and menus, built on the design tokens in
  `app/src/theme` (see `design-system.md`).
* Sound with `expo-audio` (throw, slide, impact, blast, Round Killer, win) and
  haptics with `expo-haptics`.
* Juice: blast particles, lights filling up, a big Round Killer moment.
* Accessibility: tell teams apart by shape or pattern, not colour alone;
  readable text sizes.

**Done when:** no placeholder rectangles remain and every key moment has sound
and vibration.

### M5 — Release

* `app.json` / `app.config.ts`: bundle IDs, name, icons, splash.
* EAS profiles `development`, `preview`, `production`.
* Add `eas submit` to the deploy flow for Play internal testing and TestFlight.
* **Gameplay analytics**, to feed the modes after v1: mode and options
  chosen, match length and round count, result, wind charge use, Round
  Killers, matches abandoned midway. No personal data, consent where the law
  requires it (GDPR), and an off switch in Settings.
* Crash reporting.
* Test on a small device matrix: one iPhone, one mid-range Android, one
  tablet.
* Store metadata and a privacy policy that describes the analytics. No
  Minecraft or Hermitcraft trademarks in the name or store images.
* Betas and release candidates on Play internal testing and TestFlight.

**Done when:** friends install from TestFlight or Play and play without help.

## Deploys

Until M5, deploys are internal EAS builds only, not store tracks. Set this up
at the end of M1.

**EAS Free plan limits** ([pricing](https://expo.dev/pricing),
[FAQ](https://docs.expo.dev/billing/faq/), checked 2026-11-26):

| Resource | Free | Starter ($19/month) |
|---|---|---|
| Builds | 15 Android + 15 iOS a month, low priority | $45 credit, then about $1–2 per Android and $2–4 per iOS build |
| Build timeout | 45 min | 2 h |
| EAS Workflows minutes | 60 a month (build jobs use the build quota) | usage-based |
| EAS Update | 1,000 MAU | 3,000 MAU, then usage-based |
| Quota used up | Builds stop until the 1st of next month; never charged | overage billed |

Builds that fail within 3 minutes don't count (up to 10 a month, Free only;
[changelog](https://expo.dev/changelog/2024-05-02-fast-failed-builds-exclusion)).

**Flow until M5:**

1. A push to `main` runs CI (tsc, lint, tests) on GitHub Actions.
2. If it passes, compute the project's native fingerprint (`@expo/fingerprint`).
3. Same fingerprint as the last build: publish `eas update` to the `preview`
   channel. Existing builds pick it up, and no build is used.
4. Different fingerprint: `eas build --profile preview` with
   `distribution: internal`. Android ships as an APK installed from a link or
   QR code, and iOS as an ad hoc build.
5. Manual deploys when needed: `eas build` from the command line, or
   `eas build --local`, which uses no quota.

**Room for manual deploys:** after 10 automatic native builds per platform in a
month, the workflow stops building and only publishes updates. The other 5 are
kept for manual deploys.

**iOS:** an ad hoc build needs an Apple Developer account ($99/year) and every
test iPhone registered (`eas device:create`). Without an account, internal iOS
testing stays on the simulator until M5.

**Why GitHub Actions rather than EAS Workflows:** the Free plan's 60 Workflows
minutes run out quickly if fingerprinting and updates run there on every push.
On GitHub Actions only the builds count against EAS.

**Move to Starter** if native builds often pass 15 per platform, or the
low-priority queue slows playtests down.

## Versioning

SemVer, with pre-releases before 1.0.0. How to cut releases and switch
phases: `releasing.md`.

| Phase | Versions | When |
|---|---|---|
| Development | 0.1.0, 0.1.1, 0.2.0 … | M0 to M4. Minor for features, patch for fixes |
| Beta | 1.0.0-beta.1, 1.0.0-beta.2 … | M5, on Play internal testing and TestFlight |
| Release candidate | 1.0.0-rc.1, 1.0.0-rc.2 … | Feature freeze, fixes only |
| Stable | 1.0.0, 1.0.1, 1.1.0 … | In the stores |

Pre-release labels use a dot (`beta.10` sorts after `beta.9`; `beta-10` would
sort before `beta-2`).

**Automation:**

* **Conventional Commits** (`feat:`, `fix:`, `feat!:`), checked by commitlint
  in a `commit-msg` hook and, on the PR title, in CI.
* **release-please** as a GitHub Action keeps a release PR open with the next
  version and the CHANGELOG. Merging it creates the tag and the GitHub
  Release.
* In 0.x, `bump-minor-pre-major` so a breaking change bumps the minor instead
  of jumping to 1.0.0.
* Betas and RCs use the `prerelease` strategy with `prerelease-type: beta`,
  then `rc`. Going to 1.0.0 is a `Release-As: 1.0.0` commit. Beta and RC
  GitHub Releases are marked as pre-releases.
* **One source for the version:** `package.json`, read by `app.config.ts`.
* **Store limit:** iOS only accepts numeric versions, so the
  `1.0.0-beta.2` binary ships as `1.0.0`. The full version lives in the tag,
  the release and the Settings screen.
* **Build numbers** (iOS `buildNumber`, Android `versionCode`) are managed by
  EAS with `appVersionSource: remote` and `autoIncrement`.
* **EAS Update** uses the `fingerprint` `runtimeVersion` policy, so an update
  only reaches compatible builds.

## After v1: rotating modes

After launch, the game collects analytics and uses them to create modes that
rotate, both our own and fan-made.

* **Phase 1, observe:** the M5 analytics show which presets and Custom options
  people use, how long matches last and where people quit.
* **Phase 2, our modes:** design modes from that data and rotate them (for
  example, a mode of the week). Because modes are data (M3), a new one can ship
  by remote config or EAS Update, without a store release.
* **Phase 3, fan-made modes:** let players share a Custom mode (a code or a
  link) and pick the best for the rotation. Moderation and a stable mode
  format come first.

## Risks

* **Android performance** with physics on the JS thread. Measure early in M2;
  the fallback is identified.
* **Balance.** The numbers are reasoned, not tested, and each preset adds
  tuning work. Use the debug panel, logged playtests, and safe limits on
  Custom options.
* **Analytics privacy.** Collecting data needs correct consent and privacy
  policies in both stores. Collect only anonymous gameplay events and pick the
  tool early in M5.
* **Expo churn** every SDK. Follow `app/AGENTS.md` (versioned docs,
  `expo install`, `expo-doctor` in CI).
* **IP.** The game is inspired by a Minecraft build. Original art only, and no
  trademarks in the store listing.

## Next steps

1. Finish M0: typecheck and tests in CI, and release 0.1.0.
2. Turn `config` into a `GameMode` passed to the engine, to prepare the
   presets.
3. First fps measurement and first playtest on a real device.
4. Investigate the analytics tool and the bundle ID (decisions 6 and 7).
