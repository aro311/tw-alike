# Drawing layer scaffold

## What to build

Add the shared infrastructure that all drawing tools depend on, end-to-end: DrawingTool state in the Zustand store, a DrawingToolbar component rendered inside ChartPanel, an empty `IPanePrimitive` mounted on the main candlestick series, pointer-event locking when any drawing tool is active, and reset to Cursor when the active Symbol changes.

No actual drawing tools are implemented here — this slice proves the wiring works and unblocks all subsequent tool slices.

## Acceptance criteria

- [ ] A vertical DrawingToolbar (~36–40px wide) renders on the left edge of ChartPanel with 6 buttons: Cursor, HorizontalRay, Fibonacci, PriceRange, DateRange, Brush
- [ ] `DrawingTool` state lives in the Zustand store; selecting a toolbar button updates it
- [ ] Clicking the Cursor button (or pressing `Escape` while idle) sets DrawingTool to Cursor
- [ ] When DrawingTool is not Cursor, pointer events on the chart canvas are captured by the drawing layer (chart pan/zoom is locked)
- [ ] When DrawingTool is Cursor, chart pan/zoom works normally
- [ ] Switching the active Symbol resets DrawingTool to Cursor
- [ ] An empty `IPanePrimitive` is attached to the main candlestick series (draws nothing yet, but the attachment lifecycle is wired)

## Blocked by

None — can start immediately
