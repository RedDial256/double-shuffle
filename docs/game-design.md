# Double Shuffle — Game Design Notes

Status: **draft / discovery notes**, not a final spec. This document captures everything confirmed so far about the *original* ruleset, plus open questions that need answers before implementation starts.

## 1. Concept & Inspiration

Double Shuffle is a 2-player game inspired by real-world shuffleboard, itself inspired by **"Shuffled to Bits"** — a minigame built and played in Minecraft by Hermitcraft members **Skizzleman** and **ImpulseSV** during **Hermitcraft Season 11**.

Two players stand at opposite ends of a long ice rink and use a **spear** (like a shuffleboard cue) to launch **sulphur cubes** (colored blocks acting as pucks) down the ice toward scoring zones at the far end. The goal is to land your cube as far forward as possible — ideally right on the edge — without it sliding completely off the board.

## 2. Equipment & Board

- **Rink**: a long rectangular sheet of ice (packed ice / blue ice in the Minecraft reference build), bordered on the long sides by decorative fencing.
- **Scoring zones**: near *each* end of the rink, a series of lines mark three scoring bands plus an edge strip (see Section 4). Since players shoot toward the opposite end, the zones a player is aiming for are the ones nearest their opponent.
- **Starting line**: each player stands behind a marked line (visible as a cyan/teal strip in the reference screenshots) on a wood/gravel platform, with their rack of colored cubes (red vs. blue) lined up beside them.
- **Lever / RNG bumpers**: each side has a lever that, when flipped at the start of the game, triggers randomized obstacles ("bumpers") on the ice. Per the in-game rulebook: *"No need to look for a pattern, there isn't one"* — the bumper layout is randomized each time, not a fixed puzzle to learn.
- **Cubes ("sulphur cubes")**: the pucks. Colored per team — **4 red cubes / 4 blue cubes** (8 total) as the default set. The number of cubes in play per round, and the number of rounds per game, are meant to be **tunable parameters** rather than fixed — the design should support adjusting both to control pacing and avoid overly long matches.
- **Spear**: the tool used to strike/launch a cube down the ice, functioning like a shuffleboard cue.

## 3. Turn Structure

1. Players alternate turns/throws.
2. On your turn, you launch one sulphur cube from your starting line down the ice toward the far scoring zones using your spear.
3. While you shoot, **the opponent (not currently shooting) may use up to 2 wind charges per throw** to try to disrupt your cube's slide (see Section 5).
4. Play continues, alternating throws, until both players have used their cubes for the round (4 each by default — see Section 2).

## 4. Scoring Zones

Distance-based zones, from the neutral ice toward the far edge:

| Zone | Description | Points |
|---|---|---|
| Neutral ice | Cube doesn't reach a scoring zone | 0 |
| Zone 1 | Closest scoring zone | 1 |
| Zone 2 | Middle zone | 2 |
| Zone 3 | Furthest zone (deepest into scoring territory) | 3 |
| Edge | Cube stops right at the boundary block, nearly falling off | 4 |
| Off the board | Cube slides completely off the far edge | 0 (cube is out of play) |

**Only the player with the cube(s) furthest forward scores for that position** — similar to real shuffleboard/curling scoring. If both players have cubes in play, compare final resting positions; the leading side scores for each of its cubes that sits ahead of the opponent's best cube.

## 5. Defensive Play — Wind Charges ("Windburst")

- The player **not** currently shooting can throw wind charges at the incoming cube to disrupt it.
- **Limit: up to 2 wind charges per throw** (confirmed both by the user and by the in-game rulebook page: *"The team not shooting can use up to 2 wind burst obstructions per throw"*).
- If a wind charge impact pushes the cube **backward**, that's a **-1 point** penalty to the shooter for that cube.
- **The Round Killer** (special case, from the in-game rulebook): if a *perfectly timed* windburst sends the cube all the way back onto the wood platform behind the shooter's own starting line, that player **loses the rest of their shots for the round**. The other player finishes their remaining shots at their own pace.

## 6. Cube-on-Cube Interaction (Knockout Shots)

- Players can strike their own already-placed cubes with a new throw to knock an **opponent's** cube off the board entirely (a "takeout" shot, as in real shuffleboard/curling).
- A cube knocked completely off the board scores nothing and is out of play for the round.

## 7. Win Condition

Confirmed by rulebook page 2 ("Winning"):

> *"The team to first get to 15 points (all their lights are lit up) is the winner of the game. They not only have bragging rights, but the loser must reset all the lights and Sulfer Cubes!"*

- **First team to 15 points wins the game.**
- Score is tracked as a row of "lights" that light up progressively as points are scored — a nice reference for the in-game score UI (e.g., a lit/unlit light strip per team instead of a plain number, at least as a visual option).
- **Loser resets the board**: the losing team is responsible for resetting all lights and sulphur cubes for the next game — a physical-world chore in the Minecraft original, which in the digital version simply means the UI/board auto-resets after a win (no gameplay effect, just flavor to preserve if there's a "loser does the reset animation" beat).
- The page ends with an in-joke aside ("Eyes Out Ray Finkle!") — pure flavor text from the original build, not a mechanic. Could be preserved as an Easter egg line in the rules screen.

This resolves the earlier open question — round count is no longer needed as a win condition, but see Section 2 for the separate question of how many *rounds* a match takes to plausibly reach 15 points, which still needs a tuned default.

## 8. Visual / Aesthetic Direction

The reference build and rulebook were made *inside* Minecraft, and that's the intended look for the digital game:
- Blocky, voxel, cubic assets with chunky pixel-art textures.
- Saturated, flat block colors (the reference cubes use stained-glass-style red/blue).
- UI styled like Minecraft's book/journal GUI — parchment pages, hand-written-style headers, arrow page-turn buttons (seen in the rulebook screenshots) — good reference for in-game rules/menu screens.
- Ice rink readable as a distinct "frozen" surface (blue-ice look) bordered by contrasting fence/wall textures.

## 9. Camera / Viewpoint

**Decision for v1: 2D top-down view.** Simplest to build, cleanest to read for a physics/aiming game, and the fastest path to a playable prototype.

Two ideas are explicitly **deferred as possible future modes**, not part of the initial scope:
- A **3rd-person "puck cam"**: camera placed behind the thrown cube/player, angled roughly 15–30° above the ice, following the shot. Would need its own camera-follow and readability work (harder to judge lateral position/zones than top-down).
- The second ruleset **variant** (see Section 10).

## 10. Two Versions

The user wants to build **two versions** of this game:
1. **Original** — a faithful digital adaptation of the ruleset above (this document). **This is the current scope.**
2. **Variant** — a second version with different rules/mechanics, **not yet defined**. To be scoped later once the original is underway.

This document currently covers only the Original version. A separate `game-design-variant.md` should be started once the variant is scoped.

## 11. Technology Decision

**Stack: React Native with Expo**, targeting Android + iOS, written in TypeScript. 2D top-down (Section 9) keeps the rendering simple:

- **Rendering**: `@shopify/react-native-skia`, one canvas for the whole rink.
- **Animation**: `react-native-reanimated` shared values feed per-frame positions to the canvas without re-rendering React.
- **Physics**: `planck` (a JavaScript port of Box2D) for sliding, collisions and wind-charge impulses.

The game logic (`app/src/game/`) is plain TypeScript with no React dependency, so it can be simulated and tested headlessly. An earlier build used a dedicated game engine; see `docs/decisions.md` D-14 for why the project moved to React Native.

## 12. Open Questions / To Confirm

Resolved so far: win condition (Section 7), cubes per team (Section 2), camera for v1 (Section 9), tech stack (Section 11). Still open:

- **Rounds per match / cubes per round tuning**: confirmed these should be adjustable for pacing (Section 2), but a sensible *default* still needs picking for the first prototype (e.g., does a full 4-vs-4 round realistically move the score enough toward 15, or should rounds be shorter with more of them?).
- **Board dimensions / zone widths**: exact proportions of neutral ice vs. zones 1/2/3/edge relative to total rink length.
- **RNG bumpers**: how many appear per round, where can they appear, do they block/deflect/destroy cubes, and are they visible before the throw or only revealed as the cube travels?
- **Wind charge mechanics**: exact trajectory/targeting, cooldown or reload between charges, whether both wind charges can be aimed independently, and whether there's a way to *counter* a windburst.
- **Knockout mechanics**: can a knockout shot also trigger the Round Killer or the -1 penalty? Does the cube used for a knockout also need to survive/stay in bounds to score itself?
- **Turn order**: who shoots first each round, and does that alternate?
- **Missing rulebook pages**: the in-game rulebook is 9 pages. Pages 1, 4, 5, and 7 haven't been provided yet — page 1 is likely a title/intro page, pages 3–6 are worked scoring examples (page 6 already captured), and page 7 is unknown. Page 7 in particular might still hold mechanical detail not covered elsewhere.

## 13. Reference Assets

Stored in the project folder (`double-shuffle/`) / provided in chat:
- `top view.png` — overhead view of the ice rink, showing zone markings (labelled "1", "2", …) near each end and the lever position.
- `front view.png` — eye-level view from a player's starting platform, showing the cube rack (red/blue) and the fenced rink boundary.
- `page-3-winning.jpg` — rulebook **page 2** ("Winning" rule — filename is off by one, content is page 2).
- `regras-6-pontos.webp` — rulebook page 6 ("Scoring Visual" — example board state with Red:5, Blue:0).
- `regras-8.webp` — rulebook page 8 ("Starting" + "Windburst" rules).
- `regras-9-killer-return.webp` — rulebook page 9 ("The Round Killer" rule).
- Pages 3–5 exist but are additional worked scoring examples in the same style as page 6; not individually transcribed since they don't add new rules.

## 14. Glossary

| In-world term | Game meaning |
|---|---|
| Spear | Tool used to launch a cube (the "cue") |
| Sulphur cube | The puck; colored per team |
| Wind charge / Windburst | Defensive projectile used to disrupt an opponent's shot |
| RNG bumpers | Randomized obstacles triggered via lever at game start |
| The Round Killer | Rule ending a team's shots for the round if windburst sends their cube fully back to their own platform |
| Lights | Score display concept — one light per point, lit progressively up to 15 |
