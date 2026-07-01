# Brush tool

## What to build

Implement the Brush drawing tool. A click-drag records the pointer path as a series of `{ time, value }` coordinates sampled at `mousemove` frequency; the stroke commits on `mouseup`. The raw point array is stored as-is (no path simplification). Unlike other tools, Brush has no per-point ControlPoints — a selected brush stroke drags as a whole.

```ts
// Brush stores: points = [{ time: t, value: v }, ...] — N points, raw mousemove samples
// Whole-drawing drag shifts every point by the same delta
```

## Acceptance criteria

- [ ] Click-drag draws a freehand stroke that renders in real-time as the pointer moves
- [ ] Releasing the mouse commits the stroke and keeps the Brush tool active
- [ ] The stroke is stored as a raw array of `{ time, value }` points (no downsampling)
- [ ] Clicking a committed stroke selects it; no per-point ControlPoints appear
- [ ] Dragging a selected stroke repositions the entire path (every point shifts by the same delta)
- [ ] `Escape` during an active drag cancels the in-progress stroke
- [ ] Floating delete icon, `Delete` key, and `Cmd+Z` undo work as per the shared interaction model

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
