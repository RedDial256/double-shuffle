# Design system

The app's design tokens live in `app/src/theme/` and are imported from
`app/src/theme` (the `index.ts` barrel). Every colour, spacing, font size,
font weight, corner radius and opacity in a style comes from a token. The set
is deliberately small: add a token when a screen needs one, not ahead of time.

## Tokens

| Category | File | Tokens |
| --- | --- | --- |
| Spacing | `spacing.ts` | `3xs` 2, `2xs` 4, `xs` 8, `sm` 12, `md` 16, `lg` 20, `xl` 24, `2xl` 28, `3xl` 32, `4xl` 40, `5xl` 48, `6xl` 56, `7xl` 64 |
| Colours | `colors.ts` | semantic names: `background`, `accent`, `text.primary`, `text.onAccent`, `border.subtle`, `indicatorOff`, `scrim`, `scrimStrong`, `team[0..1]`, `board.*`, `transparent` |
| Raw colours | `palette.ts` | hue names (`teal400`, `slate950` …), only for building semantic tokens |
| Text styles | `typography.ts` | `textVariants`: `display`, `title`, `heading`, `score`, `body`, `button`, `label`, `caption` (see below) |
| Font size | `typography.ts` | `xs` 12, `sm` 14, `md` 16, `lg` 18, `xl` 20, `2xl` 24, `display` 36 |
| Font weight | `typography.ts` | `regular` 400, `bold` 700, `extraBold` 800, `black` 900 |
| Radii | `radii.ts` | `none` 0, `sm` 2, `md` 8, `full` 9999 |
| Opacity | `opacity.ts` | `disabled` 0.3, `full` 1 |

Tokens are named by their step on a scale (`spacing.md`, `spacing['2xl']`),
never by their value, so a scale can be retuned without renaming every use,
and only values on the scale exist. There is no zero token: write `0`, since
nothing is gained by naming the absence of space. Use spacing for padding,
margin and gap. Fixed sizes of a particular element (a score light is 10 × 10) are
not spacing: keep them as a named constant next to the component.

## Text styles

Text uses one of eight variants instead of free combinations of size and
weight. Each sets size, weight and line height; colour is set per use.

| Variant | Size / weight / line height | Used for |
| --- | --- | --- |
| `display` | 36 / 900 / 44 | once-per-match moments: the winner, the Round Killer |
| `title` | 24 / 900 / 32 | screen titles (Rules), the round summary headline |
| `heading` | 18 / 800 / 24 | section headings, toast messages |
| `score` | 20 / 900 / 24, tabular digits | scores and other changing numbers |
| `body` | 16 / 400 / 24 | running text such as the rulebook |
| `button` | 16 / 800 / 20 | button labels |
| `label` | 14 / 800 / 20 | team names, the turn banner, small buttons |
| `caption` | 12 / 700 / 16, uppercase | round number, totals, penalties |

`fontSize` and `fontWeight` are the primitives the variants are built from.
Reach for them only to add a variant, and add one only when none of the eight
fits.

## Rules

* Text styles spread a `textVariants` entry and add a colour.
* Components import `colors`, never `palette`. Name a colour token after its
  role (`accent`, `scrim`), not its hue, so a restyle touches one file.
* Colour lives in tokens, not in style literals. ESLint's
  `react-native/no-color-literals` warns about a literal in a style.
* A colour that depends on state (a team's colour, a lit or unlit light)
  picks between styles defined from tokens, not an inline style object.
* Skia drawing on the board uses `colors.board.*` and `colors.team`.
* Game rules and physics stay in `app/src/game/config.ts`. Colours moved out
  of it into the theme.

## Not yet tokens

These categories have no values in the app yet. Add them when the first use
appears:

* **Durations and easing** for UI animation (the toast duration comes from
  the engine, and game timings stay in `config.ts`).
* **Z-index** layers, once there is more than one overlay (Rules, round
  summary, game over).
* **Shadows / elevation** for cards and buttons.
* **Border widths** beyond the single 1 px border in use today.
* **Font family**: the system font for now; a game font belongs to the M4
  art pass.
* **Light theme or theming at runtime**: tokens are static constants today. If
  a second theme is ever needed, wrap them in a context then.
