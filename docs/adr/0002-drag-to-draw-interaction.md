# Drag-to-draw replaces click-based state machines

All drawing tools (horizontal ray, price range, fibonacci, date range) use a mousedown → drag → mouseup gesture to place a drawing, rather than separate click state machines.

The previous model required 1 or 2 discrete clicks per tool. This meant: no visual feedback between clicks, users could accidentally commit a partial drawing, and the UX diverged from TradingView's established convention. It also scattered state across five separate `useRef` trackers inside `ChartPanel`.

The drag model resolves all of these: a single `inProgressRef` covers every tool, a live preview primitive gives continuous visual feedback, and the 4-pixel threshold prevents accidental placements.

## Considered Options

- **Keep click-based, add preview on first click**: shows a ghost drawing after the first click to simulate feedback. Adds a preview rendering path without removing the state machine complexity.
- **Drag for 2-point tools, click for horizontal ray**: a hybrid — horizontal ray stays 1-click, others switch to drag. Inconsistent UX and still requires separate per-tool state.
- **Full drag for all tools (chosen)**: uniform gesture across all tools, single unified drag handler, preview primitive pattern reuses existing primitive classes without a separate rendering mode.
