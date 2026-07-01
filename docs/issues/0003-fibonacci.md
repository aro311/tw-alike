# Fibonacci retracement tool

## What to build

Implement the Fibonacci drawing tool. Two clicks define the high and low of the retracement grid; the seven standard levels render as labelled horizontal lines between (and outside) those points. A live ghost preview renders while the user moves the mouse between click 1 and click 2. The two endpoints become independent ControlPoints after placement.

Levels: `0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0` (hardcoded, no user configuration).

```ts
// Fibonacci stores: points = [{ time: t1, value: high }, { time: t2, value: low }]
// Level price = high - ratio * (high - low)
```

## Acceptance criteria

- [ ] First click anchors the high point; subsequent mouse movement renders a live ghost preview of the full retracement grid
- [ ] Second click commits the drawing with all seven labelled level lines
- [ ] Level labels show the ratio (e.g. `0.618`) and the corresponding price value
- [ ] After placement, two ControlPoints appear (one at the high, one at the low) when the drawing is selected
- [ ] Dragging the high ControlPoint repositions only the high; dragging the low repositions only the low; the grid recomputes live
- [ ] `Escape` before the second click cancels the in-progress drawing
- [ ] The tool stays active after each placement (draw multiple without re-selecting)
- [ ] Floating delete icon, `Delete` key, and `Cmd+Z` undo work as per the shared interaction model

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
