# Double-click on drawing body opens a price-edit dialog

Double-clicking a placed drawing opens a small modal dialog where the user can type an exact price value for each price point, rather than requiring drag-only repositioning.

## Decision

Use `chart.subscribeDblClick(param => ...)` (added in LWC 4.1, available in v5) as the trigger. The handler reads `param.hoveredObjectId` to identify the drawing — the same mechanism already used by `subscribeClick` for selection and deletion. When a match is found, a React state value (`editingDrawingId`) is set, which mounts the dialog.

The dialog is a React component rendered outside the chart canvas (standard DOM), pre-populated with the drawing's current `points[n].value` price(s). On confirm it dispatches `updateDrawing` to the Zustand store, which the primitive re-renders on the next frame.

## Considered Options

- **Native DOM `dblclick` on the chart container**: Would require re-implementing the hit-test logic that the primitives already encapsulate (via `hoveredObjectId`). Rejected.
- **`subscribeDblClick` (chosen)**: Reuses the existing `hoveredObjectId` routing pattern already established for `subscribeClick`. No new hit-test code needed.
- **Click-to-select then dedicated "edit" button in a floating toolbar**: Adds a second interaction step (select, then click Edit). The TradingView convention is double-click-to-edit, which is more direct.

## Scope

Applies to `horizontal_ray` (one price input), `price_range` (two independent price inputs), and `fibonacci` (two independent price inputs). `brush` and `date_range` are excluded — brush has no meaningful single price point; `date_range` is time-based.
