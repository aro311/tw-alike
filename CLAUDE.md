# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TWAlike — a web-based cryptocurrency charting app (TradingView-style). Hosted on GitHub Pages at `https://<username>.github.io/tw-alike/`. Works in any browser on desktop and mobile.

See `CONTEXT.md` for the canonical domain glossary. Use its terms (Symbol, Kline, Ticker, Interval, WatchlistEntry, Indicator, IndicatorConfig, Drawing) throughout all code and comments.

## Commands

```bash
# Install dependencies
bun install

# Dev server
bun run dev

# Type-check + production build (output → dist/)
bun run build

# Preview production build locally
bun run preview

# Deploy to GitHub Pages (manual)
# 1. bun run build
# 2. Push dist/ contents to gh-pages branch, or copy dist/ to docs/ if using docs/ source
```

## Stack

| Concern | Choice |
|---|---|
| Framework | React 19 + Vite 8 + TypeScript 6 |
| Package manager | Bun |
| State | Zustand + localStorage (`persist` middleware) |
| Charting | TradingView Lightweight Charts v5 |
| Indicators | `technicalindicators` npm package |
| Data | Binance `api3.binance.com` REST + `wss://stream.binance.com` WebSocket (no API key) |
| UI | Tailwind CSS v4 + shadcn/ui |
| Hosting | GitHub Pages (static, no server) |

## Architecture

```
src/
  types/        ← domain types: Kline, Ticker, Interval, IndicatorConfig, Drawing, WatchlistEntry
  store/        ← Zustand store (watchlist, symbol settings, UI state) persisted to localStorage
  hooks/        ← useBinanceTicker (WebSocket), useBinanceKlines (REST + WebSocket)
  components/
    chart/      ← ChartPanel (TradingView LW Charts), IntervalPicker
    watchlist/  ← WatchlistPanel (right-side panel, toggle list/icons)
    indicators/ ← indicator toggle UI (future)
    ui/         ← shadcn primitives
  lib/          ← cn() utility
```

## Data flow

**Watchlist prices:** `useBinanceTicker` opens one `wss://stream.binance.com/ws/!miniTicker@arr` WebSocket and filters updates for the symbols in the watchlist.

**Chart data:** `useBinanceKlines` fetches 500 historical candles from `api3.binance.com/api/v3/klines` on mount, then subscribes to `wss://stream.binance.com/ws/<symbol>@kline_<interval>` for live updates. The last candle is updated in-place; a new candle is appended when the timestamp changes.

**State persistence:** Zustand `persist` middleware serialises the full store to `localStorage` key `twalike-state`. Swapping to Supabase later = replacing the `storage` adapter in one file (`src/store/index.ts`).

## Layout

Full-viewport layout (no scroll). Header bar → below splits into chart area (flex-1) + right watchlist panel. Watchlist panel toggles between `list` (w-52) and `icons` (w-14) modes via the `«`/`»` button.

## Key documentation

- `CONTEXT.md` — domain glossary (canonical terms for all code)
- `docs/PRD.md` — full product requirements and user stories

## Note:
- Never use Claude Preview