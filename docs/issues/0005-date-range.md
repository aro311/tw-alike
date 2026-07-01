# DateRange tool

## What to build

Implement the DateRange drawing tool. Two clicks define the left and right timestamps of a shaded vertical band. The band spans the full visible canvas height — it has no top or bottom price boundary. A live ghost preview renders while the user moves the mouse between click 1 and click 2. The two timestamps become independent ControlPoints after placement.

```ts
// DateRange stores: points = [{ time: t1, value: 0 }, { time: t2, value: 0 }]
// value field is unused (stored as 0); band always spans full chart height
```

## Acceptance criteria

- [ ] First click anchors one time edge; mouse movement renders a live ghost preview of the shaded band
- [ ] Second click commits the drawing as a semi-transparent filled band between the two timestamps
- [ ] The band renders across the full canvas height regardless of zoom or scroll position
- [ ] After placement, two ControlPoints appear (one on the left edge, one on the right edge) when the drawing is selected
- [ ] Dragging the left ControlPoint repositions only the left timestamp; dragging the right repositions only the right timestamp
- [ ] `Escape` before the second click cancels the in-progress drawing
- [ ] The tool stays active after each placement
- [ ] Floating delete icon, `Delete` key, and `Cmd+Z` undo work as per the shared interaction model

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
