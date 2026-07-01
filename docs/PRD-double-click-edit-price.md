# Double-click drawing to edit exact price

## Problem Statement

Users can only reposition drawings by dragging them with the mouse. There is no way to set an exact numeric price for a drawing — dragging always snaps to the cursor position, making precise placement (e.g., "set this horizontal ray to exactly 46915.92") impossible.

## Solution

Double-clicking the body of a placed drawing opens a small modal dialog pre-populated with the drawing's current price value(s). The user types the desired price, confirms with Ok or Enter, and the drawing snaps to that exact price. Cancelling with Cancel or Escape leaves the drawing unchanged.

## User Stories

1. As a chart user, I want to double-click a horizontal ray to open a price-edit dialog, so that I can set an exact price level without fiddly dragging.
2. As a chart user, I want the edit dialog to be pre-filled with the drawing's current price, so that I can make small numeric adjustments rather than typing from scratch.
3. As a chart user, I want to confirm my edit by pressing Enter, so that I can stay keyboard-focused without reaching for the mouse.
4. As a chart user, I want to confirm my edit by clicking Ok, so that I have a clear, discoverable way to apply the change.
5. As a chart user, I want to cancel an in-progress edit by pressing Escape, so that I can bail out without changing the drawing.
6. As a chart user, I want to cancel by clicking Cancel, so that I have a clear way to discard the edit.
7. As a chart user, I want the dialog title to reflect the drawing type (e.g. "Horizontal Ray"), so that I always know which drawing I'm editing.
8. As a chart user, I want to edit the single price of a horizontal ray, so that I can pin it to an exact level.
9. As a chart user, I want to edit both Point 1 price and Point 2 price of a price range independently, so that I can precisely define both edges of the band.
10. As a chart user, I want to edit both Point 1 price and Point 2 price of a fibonacci drawing independently, so that I can anchor the grid to exact high/low values.
11. As a chart user, I want to enter any numeric price value — including one outside the visible chart range — so that I can set up levels in advance or at exact off-screen prices.
12. As a chart user, I want the drawing to immediately reposition to the new price after I confirm, without a page reload, so that I see the result instantly.
13. As a chart user, I want my edited price to persist across page reloads, so that my drawings are not lost after refreshing.
14. As a chart user, I want double-click to work while in cursor mode (not while a drawing tool is active), so that accidental double-clicks during drawing placement don't trigger the dialog.

## Implementation Decisions

- **Trigger mechanism**: `chart.subscribeDblClick(param => ...)` from LWC v5 is used to detect the double-click. `param.hoveredObjectId` identifies the target drawing — the same routing already used by `subscribeClick` for selection and deletion. See ADR `0003-double-click-edit-price`.

- **State**: A new piece of React state (`editingDrawingId: string | null`) is added to `ChartPanel`. Setting it to a non-null drawing id mounts the dialog; null unmounts it.

- **Guard**: The `subscribeDblClick` handler only fires the dialog when `activeTool === 'cursor'`. Drawing tools in active placement mode are not affected.

- **Dialog component**: A new `DrawingEditDialog` React component renders as a standard DOM modal (not inside the canvas). It receives the `Drawing` object and an `onConfirm(patch: Partial<Drawing>)` callback. On confirm it dispatches `updateDrawing` to the Zustand store.

- **Fields by drawing type**:
  - `horizontal_ray` → one labeled numeric input: "Price"
  - `price_range` → two labeled numeric inputs: "Point 1 price", "Point 2 price"
  - `fibonacci` → two labeled numeric inputs: "Point 1 price", "Point 2 price"

- **Validation**: No clamping, no snapping. Any finite numeric value is accepted as-is.

- **Confirm/cancel**:
  - Ok button or Enter key → apply patch, close dialog
  - Cancel button or Escape key → discard, close dialog

- **Store contract**: `updateDrawing(symbol, id, { points: newPoints })` already exists and performs a shallow merge, making the patch minimal — only `points` needs to change.

## Testing Decisions

Good tests verify external behavior only: that after a user interaction the store contains the correct updated price, and that the dialog appears/disappears at the right moments. Implementation details (which React state variable holds the dialog, how the primitive re-renders) are not tested.

**What to test:**

- `DrawingEditDialog` unit: renders correct number of inputs per drawing type; pre-fills with current price(s); calls `onConfirm` with updated points when Ok is clicked; calls `onConfirm` with updated points on Enter; calls `onCancel` on Cancel; calls `onCancel` on Escape.
- Integration (ChartPanel + store): double-clicking a drawing id dispatches `updateDrawing` with the new price; the store's drawing entry reflects the new `points[n].value`; cancelling leaves the store unchanged.

**Prior art**: Other drawing interaction tests follow the pattern of wiring a store, simulating pointer events, and asserting store state. Follow the same pattern here.

## Out of Scope

- Editing the time/bar coordinate of any drawing point.
- Editing style properties (color, width) from this dialog — those are handled by the toolbar.
- Double-click edit for `brush` and `date_range` drawings.
- Editing fibonacci level ratios or adding custom ratio levels.
- Undo support specifically for dialog edits (the existing single-level `Cmd+Z` only undoes placement, not repositioning).

## Further Notes

- The `subscribeDblClick` API fires for any double-click on the chart pane. The `hoveredObjectId` check ensures only drawing-body double-clicks open the dialog; double-clicks on empty chart space are ignored.
- LWC's `subscribeClick` fires on the first click of a double-click sequence. The existing selection logic will therefore select the drawing on the first click, and the second click (the dblclick event) will open the dialog. This is the correct UX: the drawing becomes selected (showing control points) before the dialog opens.

## Blocked by

- [#0002 HorizontalRay — full interaction model](./0002-horizontal-ray-interaction-model.md)
- [#0003 Fibonacci retracement tool](./0003-fibonacci.md)
- [#0004 PriceRange tool](./0004-price-range.md)
