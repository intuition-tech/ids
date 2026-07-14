# Generative cover (`ids-gen-cover`)

Flex-strip cover driven by `seed-a` / `seed-b`. Same seeds → same image.

## Basic algorithm (Adam WIP)

From two seeds via mulberry32:

1. `direction` ∈ {h, v, hr, vr}
2. `primaryCount` — number of main strips
3. Color window start on a scale from `IdsGenCover.palettes` (each neighbor pair gets a 50% `color-mix`)
4. `distortion` — exponential flex ratios along strips

## Glow

- Last strip: soft `box-shadow`, `R = size × 0.8 × soft`, soft ∈ [0.5, 1.2] from a separate seed stream
- Plus thick accents on the two thickest non-last strips: earlier ~8% size, later ~18%

## Hover (fade)

Color window shifts one palette step on hover: **100ms** in, **700ms** out.

## Grain

Film grain overlay by default: SVG fractal noise, `size = 1`, `contrast = 3`, `mix-blend-mode: overlay`. Disable with attribute `grain="off"` (also `false` / `0`).

## Color scale

Attribute `palette` picks a named scale. Neighbors get a 50% `color-mix`.

| Id                                                | Notes                                                |
| ------------------------------------------------- | ---------------------------------------------------- |
| `prism`                                           | IDS tokens without yellow (default)                  |
| `punch`                                           | prism blue / green                                   |
| `billboard`                                       | high-contrast multi                                  |
| `split` `split-green` `split-yellow` `split-gray` | two-color pair patterns                              |
| `inkline` `inkline-red` `voltage`                 | high contrast (`voltage` uses light gray, not white) |
| `cobalt-teal`                                     | blue ramp, light end → turquoise                     |
| `cobalt-rose`                                     | blue ramp, light end → pink                          |

Demo: global Palette + Randomize all + Grain; per-cover table (Seeds / Width / Aspect / −) with a trailing + row; flex-wrap gallery.

## Taste constraints (2026-07-11)

Tuned against rated seed pairs. **Bad** covers were almost always gray-dominated on the large blurred strip. **Good** covers ended on a chromatic color.

| Constraint       | Current                                                                                                | Basic revert                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `primaryCount`   | 5…8                                                                                                    | `4 + floor(random()*5)` → 4…8                          |
| `MIN_DISTORTION` | 1.12                                                                                                   | 1 (equal strips)                                       |
| `MAX_DISTORTION` | 1.85                                                                                                   | 2 (or Adam’s 2.5)                                      |
| Color window     | Last strip forced onto a chromatic scale slot (pure chroma or chroma↔chroma mix; no gray / gray↔color) | `shiftStartIndex = floor(random() * allColors.length)` |

In [`js/gen-cover.js`](../js/gen-cover.js) these are marked `TASTE`. To restore the naive mapping, undo those three spots (comments show the basic lines).
