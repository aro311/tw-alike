# Click-click placement for two-point drawings

*Partially supersedes [0002-drag-to-draw-interaction.md](./0002-drag-to-draw-interaction.md).*

`PriceRange`, `Fibonacci`, and `DateRange` drawings use a click-to-start / move-to-preview / click-to-commit gesture instead of drag-to-draw. `HorizontalRay` (single click) and `Brush` (freehand drag) are unchanged.

Drag-to-draw is difficult to use precisely: on a trackpad the cursor drifts while pressing, and placing a tight price range or short fibonacci span requires holding the mouse button steady across a small pixel distance. Two separate clicks — one to anchor the start point, one to commit the end point — let the user reposition their hand between clicks and observe the live preview before committing.

ADR 0002 cited no-visual-feedback and state complexity as reasons to prefer drag. The click-click model retains the live preview (same `previewRef` pattern) and the same unified placement ref (`drawPlacementRef`, formerly `drawDragRef`). The state complexity objection no longer applies.

The 4-pixel minimum drag threshold is removed — a deliberate second click at any distance is intentional.

Escape cancels a placement in progress (same as before). The tool resets to Cursor after commit (same as before).

## Considered Options

- **Keep drag, improve drag sensitivity**: lower the 4-pixel threshold and add pointer-capture so the cursor can leave the overlay without cancelling. Solves the accidental-cancel problem but not the trackpad-precision problem.
- **Click-click for all tools including brush**: makes brush a point-sequence tool (click each vertex). Changes brush's fundamental character — freehand continuous strokes are the whole point.
- **Click-click for two-point tools only (chosen)**: surgical change. Brush stays drag-based. HorizontalRay already commits on a single click. Only the three two-point tools change, and they change uniformly.
