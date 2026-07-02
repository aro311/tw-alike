# Fibonacci retracement — visual redesign

## Parent

[#0003 Fibonacci retracement tool](./0003-fibonacci.md)

## What to build

Restyle the Fibonacci drawing to match TradingView's visual convention: a fixed per-level color palette, translucent fill bands between levels, a dashed trend line between the two ControlPoints, and open-circle ControlPoints with drag-to-reposition support. The seven levels stay unchanged (`0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0`, hardcoded, no user configuration) — this is a rendering and interaction change, not a new level set.

### Ratio-to-anchor mapping fix

Today's formula assigns `points[0]` (the anchor placed on mousedown) to ratio `0` and `points[1]` (mouseup) to ratio `1`, regardless of which price is higher. This is backwards from the intended convention: **`points[0]` (mousedown) is always ratio `1`; `points[1]` (mouseup) is always ratio `0`.** Dragging up vs. down simply changes which price ends up physically on top — the underlying assignment by click order stays fixed.

```ts
// points = [{ time: t1, value: p0 }, { time: t2, value: p1 }]
// p0 (mousedown) = ratio 1.0 anchor; p1 (mouseup) = ratio 0.0 anchor
// levelPrice(ratio) = p1 + ratio * (p0 - p1)
```

No migration for existing saved drawings — they render inverted after this ships (self-correcting on redraw); acceptable for this local-only, single-user app.

### Per-level fixed color palette

Each FibonacciLevel gets a fixed color, independent of the drawing's `color` field and the toolbar's color swatches. Reuses existing app color constants (no new hex values introduced):

| Ratio | Color | Hex |
|---|---|---|
| 0 | gray | `#6b7280` |
| 0.236 | red | `#ef4444` |
| 0.382 | amber | `#f59e0b` |
| 0.5 | green | `#22c55e` |
| 0.618 | cyan | `#06b6d4` |
| 0.786 | blue | `#3b82f6` |
| 1 | gray | `#6b7280` |

The `DrawingToolbar` color swatches are hidden entirely when `activeTool === 'fibonacci'`, since they'd have no effect.

### Bounded box geometry

Level lines and fill bands span only the time range between the two anchors — `min(points[0].time, points[1].time)` to `max(...)` — not the full canvas width and not an unbounded rightward ray. Nothing is drawn outside that time range, and nothing is filled above ratio `0` or below ratio `1`.

### Fill bands

Between each pair of adjacent levels, render a translucent band (fixed ~15% opacity) colored with the color of the level at its ratio-higher edge (e.g. the band between `0` and `0.236` is tinted `0.236`'s red). No fill outside the `0`–`1` range.

### Trend line

A dashed line connects the two ControlPoints directly, fixed neutral gray (matching the existing crosshair dash style), fixed `1px` width — not affected by the drawing's chosen width or color.

### ControlPoints and drag support

Render the existing open-circle ControlPoint style (6px radius, blue `#3b82f6` ring) at both anchors, visible only when the drawing is selected — reusing the same visual already used by `HorizontalRay`. Unlike today (where Fibonacci has no drag support at all), wire each ControlPoint into the drag handler so dragging one anchor repositions only that endpoint; the grid, fill bands, trend line, and labels all recompute live.

### Labels

Inline label format changes from `0.618  135592.45` to `0.618 (135,592.45)` — ratio in its shortest natural form (not padded to 3 decimals), price with comma thousand-separators, wrapped in parentheses. Label color matches its level's fixed color. Position moves from the canvas's left edge to just left of the box's start (`min` time), right-aligned.

### Delete icon

Reposition the floating delete icon to sit above whichever ControlPoint is topmost on screen (by price), rather than always anchoring to `points[0]` — avoids overlapping the new ControlPoint circle regardless of drag direction.

### Selection hit-testing

Clicking anywhere inside the bounded box — not just near a level line — selects the drawing, mirroring `PriceRange`'s clickable-fill pattern (`isBackground: true`), bounded on both the time and price axes.

### Out of scope

- Extension levels (`1.618, 2.618, 3.618, 4.236`) shown in early mockups — explicitly dropped, only the existing 7 levels are restyled
- Right-axis price labels (`priceAxisViews()`) for each level
- User-configurable level ratios or per-level custom colors
- Migration of existing saved Fibonacci drawings' inverted anchor semantics

## Acceptance criteria

- [ ] `points[0]` (mousedown) always renders at ratio `1.0`; `points[1]` (mouseup) always renders at ratio `0.0`, regardless of which price is higher
- [ ] Each of the 7 levels renders in its fixed color per the table above, independent of the drawing's `color` field
- [ ] `DrawingToolbar` color swatches are hidden while `activeTool === 'fibonacci'`
- [ ] Level lines and fill bands render only between `min(time0,time1)` and `max(time0,time1)` — nothing outside that range
- [ ] A translucent fill band renders between each pair of adjacent levels, colored per the "ratio-higher edge" rule, at a fixed opacity
- [ ] A fixed-gray, fixed-width dashed trend line connects the two ControlPoints
- [ ] Open-circle ControlPoints (matching `HorizontalRay`'s style) render at both anchors when selected
- [ ] Dragging a ControlPoint repositions only that anchor; the grid, fills, trend line, and labels recompute live
- [ ] Labels render as `ratio (price)` with comma-grouped price and shortest-form ratio, positioned left of the box start
- [ ] The delete icon renders above whichever ControlPoint is topmost on screen, without overlapping it
- [ ] Clicking anywhere inside the bounded box (not just near a line) selects the drawing
- [ ] Existing tests in `Fibonacci.drawing.test.tsx` and `DrawingEditDialog.test.tsx` are updated to reflect the new anchor-to-ratio mapping

## Blocked by

- [#0003 Fibonacci retracement tool](./0003-fibonacci.md)
- [#0009 Double-click edit dialog — fibonacci](./0009-double-click-edit-fibonacci.md)
