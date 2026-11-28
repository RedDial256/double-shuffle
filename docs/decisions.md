# Decisions Log

Running record of the calls made while implementing the game, per
`docs/implementation-brief.md` Section 7: where the design docs left a question
open, a placeholder choice was made, written down here, and flagged back rather
than guessed silently.

Every one of these is cheap to change — the numbers all live in
`app/src/game/config.ts`.

---

## D-01 — Both teams throw from the same end

**Status: confirmed by the user on 2026-11-26.**

`game-design.md` Section 1 says the two players "stand at opposite ends of a
long ice rink" and Section 4 says "the zones a player is aiming for are the
ones nearest their opponent".

That cannot be squared with the scoring rule. Rulebook page 6 (the
`regras-6-pontos.webp` capture) is a worked example, and it draws **red and
blue cubes interleaved inside the same bands**:

```
-------------------
        3
[R]
-------------------
        2
[R]
   [B]       [B]
[R]   [R]
      [B] [B]
```

with the result `Red: 5  Blue: 0`. Red's cube in band 3 scores 3, Red's cube at
the top of band 2 scores 2, the two Reds behind Blue's leading cube score
nothing, and Blue scores nothing at all because Red holds the front. That only
works if both teams' cubes are lying in the **same** set of bands and are
compared directly against each other.

Two more things point the same way: the overhead reference shot shows a single
rack holding **both** red and blue cubes at one end, and the Round Killer rule
(p.9) talks about one "starting line" and one "wood platform".

So the implementation is: **both teams throw from the same (near) end towards
the same (far) end, alternating throws.** The rink is still symmetric and both
ends are still marked, exactly as in the reference build — which is what real
table shuffleboard does, because you swap ends between rounds. The far bands
are the live ones; the near bands are decorative.

If you meant something different by "opposite ends", this is the one decision
worth correcting before any more work goes on top of it.

## D-02 — Rink dimensions: 15 x 48 blocks, not 15 x 80

`game-design.md` Section 13 flags "is the rink symmetric end-to-end (implying
~80x15 blocks total)" as open. 80 blocks was tried and is too long to read on a
phone: at 720x1280 portrait the whole rink only fills about a third of the
screen width, and the cubes end up ~16 px across.

Current layout, 48 blocks end to end:

| Section | Blocks |
|---|---|
| Wood platform (each end) | 5 |
| Zone 3 / zone 2 / zone 1 band (each) | 3 |
| Neutral ice | 20 |
| **Total length** | **48** |
| Width | 15 |

That gives 38 blocks of ice to slide down, and leaves a gutter down each side
of the screen wide enough for the score lights. `platform`, `band` and
`neutral` in `config.ts` re-lay the whole board (visuals, walls, dispensers and
scoring) when changed.

## D-03 — 4 points is an overhang test, not a painted band

Rulebook page 7: *"If even a single pixel of a puck is hanging over the back of
the table without falling, that's a 4 pointer!"* So the 4 is not a fourth
strip of ice — it is the condition "my leading edge is past the back edge but
my centre of mass is not". Implemented exactly that way in
`zoneValue()` in `app/src/game/scoring.ts`; a cube whose centre crosses the line falls off and
scores nothing.

## D-04 — Qualified points resolve upwards

Page 7: *"A puck is officially in the point range as long as a single pixel is
touching the ice of that section."* A cube straddling two bands therefore
qualifies for both, and the implementation gives it the **higher** one, because
everything else about the game rewards getting further forward. Every scoring
decision uses the cube's leading edge (rotation included), never its centre.

## D-05 — The windburst penalty replaces the cube's points

Section 5 of the design doc says a backwards push is "a -1 point penalty to the
shooter for that cube", without saying whether that is instead of or on top of
whatever the cube would otherwise be worth.

Implemented as **instead of**: a cube the windburst pushed backwards is worth
exactly -1 to its own team and is excluded from the lead comparison. Applying
it on top would usually be invisible, since a cube that got shoved backwards is
almost never the one holding the front.

The flag is set when a blast leaves the cube travelling backwards faster than
`windBackwardPenaltySpeed` (just under 1 block/s), which stops a glancing sideways nudge
from counting.

## D-06 — Knockouts do not trigger the Round Killer or the -1

`game-design.md` Section 13 asks whether a knockout shot can also trigger these.
Both rules are written as consequences of a **windburst** specifically
("due to a perfectly timed wind burst", p.9), so:

* Only a wind charge can set the -1 flag.
* Only a cube carrying that flag can trigger the Round Killer.
* A cube that ends up behind the starting line for any other reason (bounced
  off another cube, say) simply leaves play for 0, with no penalty.

A knockout that pushes an opponent's cube off the far end still removes it from
play with 0 points, as Section 6 describes.

## D-07 — Match totals are clamped at zero

Nothing in the rulebook says what happens if a team's penalties outweigh their
points in the opening round. Round scores can be negative, but the running match
total floors at 0. Flip `allowNegativeMatchScore` in the `GameMode` (`mode.ts`) to change
this.

## D-08 — The first thrower alternates each round

Open question in Section 13. Red opens round 1, Blue opens round 2, and so on
(`alternateFirstShooter`). Within a round the teams simply alternate, except
that a round-killed team is skipped and the other finishes at their own pace,
as page 9 requires.

## D-09 — Defaults: 4 cubes each, first to 15

4 cubes per team per round comes straight from the reference rack; 15 points
comes from the rulebook (p.2). With single-digit round scores that lands at
roughly 4-8 rounds a match, which felt like the right pacing target. Both are
`cubesPerRound` and `targetScore`.

## D-10 — Wind-charge input: tap anywhere, nearest dispenser fires

Open question in the brief. The dispensers sit in both side walls every 3
blocks, matching the reference build. While a cube is sliding, the defending
team taps anywhere and the dispenser closest to the tap fires a charge straight
across the ice. The charge takes real time to cross, so *when* you tap is the
skill, and firing one slightly ahead of the cube is what produces a backwards
push — which is how "a perfectly timed wind burst" ends up meaning something
mechanically.

No timing window, no cooldown; just the 2-per-throw limit from page 8.

## D-11 — Camera holds the whole rink

The design doc fixes 2D top-down for v1 but not the framing. Chasing the cube
means aiming at a target you cannot see, which is much worse than small cubes,
so `Board.tsx` scales the whole board to fit the screen at all times. There's
no follow mode yet; adding one would mean animating the canvas transform
towards the live cube if the punch-in turns out to feel better.

## D-12 — Layout is generated from config

Nothing about the board is hand-placed. `Board.tsx` draws the rink, bands,
walls and dispensers from `config.ts`, and `engine.ts` builds its physics walls
and scoring lines from the same functions (`yIceFar()`, `farBandBoundaries()`,
`dispensers()` and so on). It keeps the board, the physics and the scoring
reading from one set of numbers while the game is being balanced. Once the
proportions settle and real art arrives, swapping the drawn rectangles for
images is a contained change inside `Board.tsx`.

## D-13 — Placeholder art only

Per the brief's IP note, nothing is traced or extracted from the reference
screenshots. Everything on screen is flat coloured rectangles drawn in code.

## D-14 — Switched the stack from Godot to React Native

**Status: done.** The first playable build was written in Godot 4 with
GDScript. It has since been ported to **React Native with Expo**, and the
Godot project was removed.

Why: React Native is what the user already knows, so they can read, change and
debug the game without learning a new engine and language first. The game is a
2D top-down board with a handful of bodies, which doesn't need a game engine's
editor or scene tree, and keeping everything in one TypeScript codebase also
covers the menus, settings and store work that would have needed a React
Native shell around Godot anyway.

What replaced what:

| Concern | Before (Godot) | Now (React Native) |
|---|---|---|
| App shell, build | Godot export presets | Expo (`app/app.json`, EAS for store builds) |
| Rendering | Godot 2D nodes | `@shopify/react-native-skia` canvas in `Board.tsx` |
| Per-frame animation | engine loop | `requestAnimationFrame` loop + `react-native-reanimated` shared values |
| Physics | Godot 2D physics | `planck` (Box2D port) in `engine.ts` |
| Tunables | autoload config script | `app/src/game/config.ts` |
| Scoring | scoring script | `app/src/game/scoring.ts` (pure functions) |
| Turns, rounds, wind charges | game manager + entity scripts | `app/src/game/engine.ts` (framework-free class) |
| Touch input | aim controller script | `app/src/ui/useAim.ts` |
| HUD | HUD and score-light scripts | `app/src/ui/Hud.tsx` |

Units changed in the port: distances are now in blocks (1 block = 1 metre in
the physics world = one cube across) instead of pixels, so the old pixel values
were divided by 48 in `config.ts`. Every rule decision above (D-01 to D-13)
carried over unchanged.

The in-game rulebook was not ported at the time. It has since been rebuilt as a
React Native screen (D-21).

## D-15 — Only the thrown cube can earn the windburst penalty

The rulebook's -1 is "a penalty to the shooter for that cube", and the Round
Killer talks about "the cube" the windburst sends back, so both refer to the
cube being thrown. The port flagged *every* cube a blast pushed backwards,
which meant a defender who caught their own settled cube in the blast lost a
point, and a shooter could be penalised for cubes thrown on earlier turns.

Now only the cube currently being thrown can be marked knocked back. A blast
still moves every cube in its radius, and those cubes can still be pushed off
either end for 0 points; they just don't carry the -1 or trigger the Round
Killer.

## D-16 — "All the way back onto the platform" means the whole cube

The Round Killer (p.9) fires when a windburst sends the cube "all the way back
onto the wood platform behind the shooter's own starting line". The port
checked whether the cube's centre was more than a block past the line, so a
knocked-back cube that stopped on the platform just behind the line stayed in
play and only cost -1. The check is now "every part of the cube is behind the
starting line" (its leading edge, rotation included, has crossed it), the
mirror image of the 4-point overhang test at the far end.

## D-17 — Releases: release-please on `app/`, plain `vX.Y.Z` tags

release-please treats `app/` as the one package, because that is where
`package.json` lives, and `package.json` is the only place the version is
written (`app.config.ts` reads it). The tag leaves out the component name
(`v0.1.0`, not `app-v0.1.0`), since the repository ships one app.

The side effect is that only commits touching `app/` count towards a release.
That matches what a release is for: a new build of the app.

The first release is set with `initial-version: 0.1.0` and an empty manifest
rather than a `release-as` in the config, which would have to be removed by
hand after the release. The iOS version is the numeric part of the version,
because App Store Connect rejects pre-release labels.

## D-18 — Per-match rules live in a GameMode

Presets, the Custom mode and the rotating modes after v1 all need rules that
change from match to match, so the match rules moved out of the global
`config` into a `GameMode` (`app/src/game/mode.ts`) that `startMatch(mode)`
copies into the engine. `restart()` keeps the current mode.

A `GameMode` holds the target score, cubes per round, wind charges per throw,
whether the first thrower alternates, whether match totals can go negative,
and the wind strength (blast radius and impulse), which the roadmap's Chaotic
preset and the Custom mode's "wind strength" option need. Everything else stays
global: board geometry (it would re-lay the rink and the art), colours, team
names, timings, throw speeds, damping and the aim controls. Those are tuned once
by playtesting (M2) rather than varied per mode; any of them can move into
`GameMode` later if a mode needs it.

`classicMode` is the rulebook rules and the default, so a match started
without a mode plays exactly as before.

## D-20 — Design tokens in `app/src/theme`

Styles had colours, spacing and font sizes written inline, and ESLint's
`react-native/no-color-literals` warned about them. The app now has a small
set of design tokens in `app/src/theme` (spacing, colours, font sizes and
weights, radii, opacity), documented in `docs/design-system.md`.

* Spacing uses the usual React Native scale (2, 4, 8, 12, 16, 20, 24, 28, 32,
  40, 48, 56, 64) with t-shirt names (`3xs` … `md` 16 … `7xl`), the same
  naming as font sizes. Keys equal to the values (`spacing[12]`) were tried
  first and dropped: a token named after its value can never change value,
  which defeats the point of a token. There is no zero token; `0` is written
  as a literal.
* Colours have two layers: a raw `palette` named by hue, and semantic `colors`
  named by role that components use. The board and team colours moved out of
  the game `config.ts`, which now holds only rules and physics.
* Off-scale values snapped to the nearest step, which changes a few pixels:
  the score-light gap 3 → 4, the toast padding 14 → 16, and the banner font
  13 → 14.
* Text has eight fixed variants (`display`, `title`, `heading`, `score`,
  `body`, `button`, `label`, `caption`) instead of free size and weight
  pairs. They cover every text in the HUD, the Rules screen and the round
  summary; the HUD's turn banner moved from weight 700 to 800 and the final
  score on the game-over screen became the bold `score` style.
* Tokens are plain constants, not a theme context: there is one theme, and a
  context can wrap them later if a second one is ever needed.

## D-21 — The Rules screen is a modal that pauses the game

The rulebook comes back as a full-screen modal opened by a Rules button in the
bottom-right corner of the game, rather than a separate route: Expo Router and
the Home/Game/Rules screens arrive in M3, and the text can move into a route
then without changes.

Opening the rules pauses the engine (`GameEngine.setPaused`). Physics, wind
charges and the between-throw and round-break timers all run on the engine's
own clock, so a sliding cube or a pending round break waits until the players
close the rules. M3's Pause modal can reuse the same switch.

The text lives in `app/src/ui/rulebook.ts` as data and reads its numbers
(target score, cubes per round, wind charges per throw) from `config`, so it
stays true when those defaults change or a game mode overrides them. It keeps
the original rulebook's "Eyes Out Ray Finkle!" aside as an Easter egg. Styles
use the design tokens (D-20); the book-style look comes in M4.

## D-22 — 0.2.0 is the app shell plus feel and balance

M2 (Feel and balance) on its own has little a player would notice: a frame
rate measurement, a gesture-handler port, a debug panel and playtests. The
rule for releases is that every minor version includes features that are
interesting to the player, so 0.2.0 bundles M2 with M3 (App shell), which
brings Home, Settings, the presets, the Custom mode and the game over flow.

M3 goes first. The fps measurement and the playtests then run on the build
players will actually get, with navigation, the Pause modal and the presets,
instead of on today's single screen, and the playtests can try the presets
too. M1's last item, sizing the cube slots from the match, comes before M3
because the Custom mode changes cubes per round.

## D-23 — A manual internal Android build for 0.1.0

0.1.0 goes to internal testers as a manual `eas build --profile preview`
Android APK, installed from the EAS link or QR code. The automatic flow in
`roadmap.md` (Deploys, issue #19) still comes in M2; this only adds what a
manual build needs.

* `app/eas.json` has a single `preview` profile with `distribution: internal`
  and `buildType: apk`. The `development` and `production` profiles come with
  issue #36.
* `appVersionSource: remote` lets EAS own the Android version code from the
  first build, so it never has to be bumped by hand.
* The Android package and iOS bundle ID are provisionally
  `com.reddial.doubleshuffle`. Open decision 7 can still change them before the
  first store upload in M5; the only cost is that testers reinstall the app.
* iOS waits for an Apple Developer account, as the Deploys section says.
