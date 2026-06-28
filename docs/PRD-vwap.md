# VWAP Indicator — Product Requirements Document

## Problem Statement

Traders analysing crypto charts need a Volume Weighted Average Price (VWAP) line as a key reference for intraday and swing decisions. Without VWAP, the chart lacks one of the most widely used institutional anchors for identifying fair value, support, and resistance. The trader must currently switch to TradingView to use VWAP, breaking their workflow.

## Solution

Add a VWAP line overlay to the main candlestick chart. The line resets at the start of each configurable anchor period (Daily, Weekly, Monthly, Yearly). A compact selector in the interval toolbar lets the trader switch anchor or turn VWAP off without leaving the chart. The current VWAP price is always labelled on the right price scale so the trader can read the value at a glance.

## User Stories

1. As a crypto trader, I want to see a VWAP line overlaid on the candlestick chart, so that I can identify the volume-weighted fair value for the current session.
2. As a crypto trader, I want VWAP to be enabled by default on app load, so that I have the key reference line without any setup.
3. As a crypto trader, I want VWAP to default to a Daily anchor, so that it resets at midnight UTC every day — the most useful anchor for intraday analysis.
4. As a crypto trader, I want to choose between Daily, Weekly, Monthly, and Yearly VWAP anchors, so that I can match the reset period to my trading timeframe.
5. As a crypto trader, I want the VWAP line to recalculate immediately when I change the anchor, so that I always see the correct cumulative value without a page refresh.
6. As a crypto trader, I want the VWAP selector to live in the same toolbar row as the interval picker, so that I can change indicator settings without navigating to a separate panel.
7. As a crypto trader, I want to turn VWAP off via the selector, so that I can remove the line when I want a cleaner chart.
8. As a crypto trader, I want the current VWAP price labelled on the right price scale, so that I can read its exact value without hovering or clicking.
9. As a crypto trader, I want the VWAP line to update live as new candle data streams in via WebSocket, so that the indicator stays accurate in real time.
10. As a crypto trader, I want the VWAP line to correctly reset at the start of each new session boundary (midnight UTC for Daily, Monday for Weekly, 1st of month for Monthly, 1st of year for Yearly), so that the cumulative calculation always reflects the current period only.
11. As a crypto trader, I want my VWAP anchor preference persisted across sessions, so that I do not have to reconfigure it every time I open the app.
12. As a crypto trader, I want the VWAP line to render in the standard TradingView blue (`#2962FF`), so that it is visually consistent with familiar charting conventions.
13. As a crypto trader, I want the VWAP anchor selector to show the active anchor label (e.g. `VWAP·D`), so that I can see which anchor is active at a glance without opening the dropdown.

## Implementation Decisions

- **Price input:** VWAP uses `hl2 = (high + low) / 2` as the typical price — matching the reference Pine Script — rather than `(high + low + close) / 3`.

- **Session key per anchor:**
  - Daily → `floor(time / 86400)`
  - Weekly → `floor((time + 3 × 86400) / (7 × 86400))` — Monday-aligned
  - Monthly → `year × 12 + month` (UTC)
  - Yearly → UTC year

- **Cumulative formula (per session):**
  ```
  vwapsum  += hl2 × volume   (reset on new session)
  volsum   += volume          (reset on new session)
  vwap      = vwapsum / volsum
  ```

- **Live update strategy:** On each live candle tick, scan backward from the current candle to find the session start in the existing Kline history, recompute VWAP for only those candles plus the live candle, then call a point update on the chart series. Full recompute from the session start avoids stale cumulative state.

- **Full reload trigger:** VWAP data is fully recomputed and reloaded whenever historical Klines change (symbol or interval switch), or when the anchor changes.

- **Global state, not per-symbol:** The VWAP anchor is a trader preference, not a per-symbol setting. It is stored as top-level global state alongside `watchlistPanelMode`, persisted to `localStorage` via the existing Zustand `persist` middleware.

- **UI placement:** The VWAP selector is passed as a `rightSlot` prop to the `IntervalPicker` component, which renders it after a visual separator at the right end of the toolbar row. No new toolbar row or modal is needed.

- **No bands:** Standard deviation bands (upper/lower envelopes) are explicitly out of scope for this version.

- **One VWAP at a time:** Only one anchor is active at a time. Multiple simultaneous VWAP lines are out of scope.

## Testing Decisions

**What makes a good test here:** test the pure calculation output given a sequence of Klines and an anchor — not the chart rendering, not the React component, not the store. The VWAP math module is a pure function with no side effects, making it the highest-value and lowest-friction seam.

**Modules to test:** `src/lib/vwap.ts` — specifically `computeVwap()` and `computeVwapLive()`.

**Key cases to cover:**
- Single session: VWAP equals `hl2` for the first candle, then tracks the cumulative correctly
- Session reset: when the anchor boundary crosses (e.g. new day), the accumulator resets and VWAP restarts from the new candle's `hl2`
- All four anchors: verify the correct session key boundaries for D, W, M, 12M
- `computeVwapLive`: given existing Klines and a live candle in the same session, the returned value matches what `computeVwap` would return for the same data appended
- Zero-volume edge case: returns `null` when cumulative volume is zero

**Prior art:** No existing tests in the codebase. This feature is the first addition of tests. Vitest is the natural fit given the Vite + Bun stack.

## Out of Scope

- Standard deviation bands (VWAP Upper / VWAP Lower)
- Multiple simultaneous VWAP anchors on the same chart
- Per-symbol VWAP anchor settings
- "Show previous VWAP close" feature (the `prevwap` plot from the Pine Script)
- User-configurable line colour or line width
- VWAP in the RSI sub-pane

## Further Notes

- The reference implementation is a Pine Script using `hl2` and volume-weighted standard deviation for bands. Only the VWAP line portion is implemented; the band formula (`sqrt(max(v2sum/volsum − vwap², 0))`) is documented in the Pine Script for future reference if bands are added later.
- Weekly anchor aligns to Monday UTC. Some platforms align to Sunday — this is a deliberate choice matching common institutional convention.
