# PRD — Drag-to-Draw Interaction Model

## Problem Statement

The current drawing tools require 1-click (horizontal ray) or 2-click (price range, fibonacci, date range) gestures to place a drawing. This is unintuitive: users must mentally track which click they are on, can accidentally place a partial drawing by clicking without intent, and see no visual feedback until the drawing is fully committed. The interaction diverges from TradingView's established UX, where all drawings are placed by dragging.

## Solution

Replace the click-based state machines with a unified drag-to-draw model: mousedown anchors the first point, dragging updates the second point with a live preview, and mouseup commits the drawing. A minimum 4-pixel drag threshold prevents accidental placements from shaky clicks. Escape during a drag cancels the stroke without resetting the active tool.

## User Stories

1. As a chart analyst, I want to place a horizontal ray by pressing and dragging rightward so that I naturally see where the ray will anchor before committing.
2. As a chart analyst, I want the horizontal ray to start exactly at my mousedown X position (not at the left edge of the chart) so that I can anchor it to a specific candle or date.
3. As a chart analyst, I want the horizontal ray to extend as a ray from my anchor point to the right edge of the chart so that it continues past my drag endpoint.
4. As a chart analyst, I want to place a price range band by dragging vertically between two prices so that I see the band fill in real-time as I drag.
5. As a chart analyst, I want to place a Fibonacci retracement by dragging from high to low (or low to high) so that the 7 levels draw live as I drag.
6. As a chart analyst, I want to place a date range band by dragging horizontally between two dates so that I see the band fill in real-time as I drag.
7. As a chart analyst, I want to see a live preview of any in-progress drawing while I am dragging so that I can make precise placement decisions before releasing the mouse.
8. As a chart analyst, I want a mouseup that ends within 4 pixels of my mousedown to cancel the drawing attempt so that accidental micro-movements do not pollute the chart with unwanted drawings.
9. As a chart analyst, I want chart panning to be blocked while a drawing tool is active so that dragging always draws rather than scrolling the chart.
10. As a chart analyst, I want pressing Escape mid-drag to cancel the current stroke without switching me back to cursor mode so that I can immediately try again.
11. As a chart analyst, I want brush strokes to continue working with the existing drag model (mousedown → mousemove → mouseup) without any change so that freehand drawing is unaffected.
12. As a chart analyst, I want all committed drawings to behave identically to before (selectable, deletable, undo-able) so that the persistence and selection model is unaffected by the interaction change.

## Implementation Decisions

### Unified drag handler replaces per-tool click state machines

The five separate in-progress refs (`priceRangeInProgressRef`, `fibInProgressRef`, `dateRangeInProgressRef`, plus brush's two refs) and `handleOverlayClick` are removed. A single `inProgressRef` on the overlay div tracks the active drag: `{ primitive, p1: {time, value}, startX: number, startY: number }`.

### Preview primitive pattern

On mousedown, a preview primitive of the appropriate type is instantiated with `p1 = p2 = mousedown coords` and attached to the series via `series.attachPrimitive`. On every mousemove, `primitive.updateDrawing(...)` is called directly (no React state, no Zustand write) — the primitive calls `requestUpdate()` internally. On mouseup, the preview primitive is detached. If the drag exceeds 4px, the real drawing is written to the store; the sync `useEffect` then mounts the permanent primitive.

### 4-pixel threshold

On mouseup, `Math.hypot(e.offsetX - startX, e.offsetY - startY) < 4` → cancel silently. The preview primitive is detached and `inProgressRef` is cleared. The active tool is not changed.

### Horizontal ray data model unchanged

`horizontal_ray` continues to store a single control point `{ time, value }`. The mousedown X determines `time`; the drag is used only to satisfy the threshold check and confirm intent. Rendering: draw from `priceToCoordinate(value)` horizontally from `timeToCoordinate(time)` to the chart's right edge.

### Escape mid-drag

Escape detaches the preview primitive, clears `inProgressRef`, but does **not** call `setActiveTool('cursor')`. The tool stays active for the next drag attempt.

### Pan locking

The overlay div carries `pointer-events-auto` whenever `activeTool !== 'cursor'` — unchanged from before. This ensures the overlay intercepts all mouse events and the underlying LWC chart never receives them while a drawing tool is active.

## Testing Decisions

Good tests exercise the observable store mutation — does dragging in a given tool mode produce the correct `Drawing` entry in `symbolSettings`? They must not test which primitive class was instantiated or how many times `updateDrawing` was called.

Tests are written at the `ChartPanel` component seam using `@testing-library/react` + `fireEvent.mouseDown / mouseMove / mouseUp` — the same pattern already established in `Brush.drawing.test.tsx`.

Behaviours to cover per tool:
- A full drag (≥ 4px) commits a drawing of the correct type with correct point values.
- A sub-threshold mousedown+mouseup commits nothing.
- Escape mid-drag commits nothing and the active tool remains unchanged.

The existing `ChartPanel.drawing.test.tsx`, `Fibonacci.drawing.test.tsx`, `DateRange.drawing.test.tsx`, and `Brush.drawing.test.tsx` serve as prior art and will be updated to use the new `fireEvent` drag pattern.

## Out of Scope

- Touch / pointer events (mobile drag) — the app targets desktop in this iteration.
- Live preview for brush strokes — brush already renders live via the existing mousemove accumulation.
- Drag-to-reposition existing drawings — select-then-drag for editing is a separate concern and unchanged.
- Snap-to-candle or snap-to-price-level during drag.

## Further Notes

- The preview primitive instances are never written to the Zustand store. They exist only in the overlay's event handler scope and are dereferenced on mouseup, making GC straightforward.
- Because preview primitives share the same class as committed ones, no separate "preview-mode" rendering path is needed — the live look matches the committed look exactly.
