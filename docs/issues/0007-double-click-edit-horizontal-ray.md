# Double-click edit dialog — horizontal_ray

## Parent

[PRD: Double-click drawing to edit exact price](../PRD-double-click-edit-price.md)

## What to build

Wire up the double-click-to-edit flow end-to-end for the `horizontal_ray` drawing type. This slice delivers the full infrastructure that the other drawing types will reuse.

When the user double-clicks the body of a placed horizontal ray while in cursor mode, a modal dialog opens pre-filled with the ray's current price. The user can type a new value and confirm (Ok button or Enter) or discard (Cancel button or Escape). On confirm, the ray repositions to the typed price immediately and the new value persists to localStorage.

Key decisions (from ADR `0003-double-click-edit-price`):
- `chart.subscribeDblClick` is used as the trigger; `param.hoveredObjectId` identifies the drawing.
- The handler is guarded: only fires when `activeTool === 'cursor'`.
- A new `editingDrawingId: string | null` React state in `ChartPanel` mounts/unmounts the dialog.
- The dialog dispatches `updateDrawing(symbol, id, { points: newPoints })` to the Zustand store on confirm.
- Any finite numeric value is accepted — no clamping or snapping.

## Acceptance criteria

- [ ] Double-clicking a horizontal ray while in cursor mode opens the edit dialog
- [ ] The dialog title reads "Horizontal Ray"
- [ ] The price input is pre-filled with the ray's current price value
- [ ] Clicking Ok applies the new price and closes the dialog
- [ ] Pressing Enter applies the new price and closes the dialog
- [ ] Clicking Cancel closes the dialog without changing the drawing
- [ ] Pressing Escape closes the dialog without changing the drawing
- [ ] Any finite numeric value is accepted (including values outside the visible chart range)
- [ ] The ray visually repositions to the new price immediately after confirm
- [ ] The updated price persists across page reloads
- [ ] Double-clicking while a drawing tool (not cursor) is active does NOT open the dialog
- [ ] Double-clicking empty chart space (no drawing hovered) does NOT open the dialog

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
