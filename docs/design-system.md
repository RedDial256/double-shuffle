# Design system

The app's design tokens live in `app/src/theme/` and are imported from
`app/src/theme` (the `index.ts` barrel). Every colour, spacing, font size,
font weight, corner radius and opacity in a style comes from a token. The set
is deliberately small: add a token when a screen needs one, not ahead of time.

## Tokens

| Category | File | Tokens |
| --- | --- | --- |
| Spacing | `spacing.ts` | `spacing[0]`, `[2]`, `[4]`, `[8]`, `[12]`, `[16]`, `[20]`, `[24]`, `[28]`, `[32]`, `[40]`, `[48]`, `[56]`, `[64]` |
| Colours | `colors.ts` | semantic names: `background`, `accent`, `text.primary`, `text.onAccent`, `border.subtle`, `indicatorOff`, `scrim`, `scrimStrong`, `team[0..1]`, `board.*`, `transparent` |
| Raw colours | `palette.ts` | hue names (`teal400`, `slate950` …), only for building semantic tokens |
| Font size | `typography.ts` | `xs` 12, `sm` 14, `md` 16, `lg` 18, `xl` 20, `xxl` 24, `display` 36 |
| Font weight | `typography.ts` | `regular` 400, `bold` 700, `extraBold` 800, `black` 900 |
| Radii | `radii.ts` | `none` 0, `sm` 2, `md` 8, `full` 9999 |
| Opacity | `opacity.ts` | `disabled` 0.3, `full` 1 |

Spacing is keyed by its value, so `spacing[12]` reads as 12 and an off-scale
value such as `spacing[14]` fails to type-check. Use it for padding, margin
and gap. Fixed sizes of a particular element (a score light is 10 × 10) are
not spacing: keep them as a named constant next to the component.

## Rules

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
* **Line heights** paired with the font sizes, once there is body text.
* **Light theme or theming at runtime**: tokens are static constants today. If
  a second theme is ever needed, wrap them in a context then.
