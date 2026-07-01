# HorizontalRay — full interaction model

## What to build

Implement the HorizontalRay drawing tool end-to-end, including the complete select/drag/delete/undo interaction model that all subsequent drawing tools will inherit. A single click places a horizontal ray at the clicked price level extending right across the full chart. The toolbar gains a color palette (8 fixed swatches) and a width picker (thin/medium/thick = 1/2/3px) whose values are recorded on every Drawing at placement time.

Key type changes (encoding design decisions from the grilling session):

```ts
// Extend existing Drawing type
export interface Drawing {
  id: string
  type: 'horizontal' | 'trendline' | 'fibonacci' | 'price_range' | 'date_range' | 'brush'
  points: { time: number; value: number }[]
  color: string   // hex from fixed 8-color palette
  width: 1 | 2 | 3
}
// HorizontalRay stores: points = [{ time: 0, value: price }] — time field unused
```

## Acceptance criteria

- [ ] Single click in drawing mode places a HorizontalRay at the clicked price level
- [ ] The ray renders across the full visible canvas width and extends right as the chart is scrolled
- [ ] Color palette (8 swatches) and width picker (3 options) appear in the toolbar when HorizontalRay tool is active; chosen values persist on the Drawing
- [ ] Clicking a placed Drawing selects it; a ControlPoint handle appears at its price level
- [ ] Dragging the ControlPoint repositions the ray to a new price level
- [ ] A floating delete icon appears above the selected Drawing; clicking it removes the Drawing
- [ ] Pressing `Delete` or `Backspace` while a Drawing is selected removes it
- [ ] Pressing `Escape` during an in-progress drawing (before the click is placed) cancels it
- [ ] `Cmd+Z` / `Ctrl+Z` removes the most recently placed Drawing (single-level undo only)
- [ ] Drawings persist across page reloads (stored in localStorage via Zustand)

## Blocked by

- [#0001 Drawing layer scaffold](./0001-drawing-layer-scaffold.md)
