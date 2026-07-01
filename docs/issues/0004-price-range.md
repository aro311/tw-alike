# PriceRange tool

## What to build

Implement the PriceRange drawing tool. Two clicks define the top and bottom price of a filled horizontal band. The band spans the full visible canvas width — it has no left or right time boundary. A live ghost preview renders while the user moves the mouse between click 1 and click 2. The two price levels become independent ControlPoints after placement.

```ts
// PriceRange stores: points = [{ time: 0, value: priceA }, { time: 0, value: priceB }]
// time field is unused (stored as 0); band always spans full chart width
```

## Acceptance criteria

- [ ] First click anchors one price edge; mouse movement renders a live ghost preview of the filled band
- [ ] Second click commits the drawing as a semi-transparent filled band between the two price levels
- [ ] The band renders across the full canvas width regardless of zoom or scroll position
- [ ] After placement, two ControlPoints appear (one on the top edge, one on the bottom edge) when the drawing is selected
- [ ] Dragging the top ControlPoint repositions only the top price; dragging the bottom repositions only the bottom price
- [ ] `Escape` before the second click cancels the in-progress drawing
- [ ] The tool stays active after each placement
- [ ] Floating delete icon, `Delete` key, and `Cmd+Z` undo work as per the shared interaction model

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
