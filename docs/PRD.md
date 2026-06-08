# TWAlike — Product Requirements Document

## Problem Statement

Crypto traders who want a clean, focused charting experience on mobile are forced to use heavyweight apps like TradingView or Binance, which bundle social features, trading execution, and advertising on top of the charting tools they actually need. There is no lightweight, native-feeling crypto chart app built specifically for monitoring a personal watchlist and reading technical indicators.

## Solution

TWAlike is a Kotlin Multiplatform mobile app (Android + iOS) that gives crypto traders a fast, offline-capable charting experience focused on their personal Watchlist. Users see real-time prices for their chosen Symbols, tap into a full-screen candlestick ChartScreen with configurable Indicators and Drawing tools, and switch between Intervals — all with no account required and data available even when offline.

## User Stories

1. As a crypto trader, I want the app to open with a pre-populated Watchlist of major Symbols (BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT), so that I see live prices immediately on first launch without any setup.
2. As a crypto trader, I want to see the live price, 24h change, and 24h volume for each Symbol in my Watchlist, so that I can quickly assess market conditions at a glance.
3. As a crypto trader, I want Watchlist prices to update in real time via WebSocket, so that I do not need to manually refresh the screen.
4. As a crypto trader, I want to tap a Symbol in the Watchlist to open its ChartScreen, so that I can analyse the price chart in detail.
5. As a crypto trader, I want to add a new Symbol to my Watchlist by tapping the `+` button and searching by name, so that I can monitor any Binance-listed trading pair.
6. As a crypto trader, I want the CoinSearchSheet to search instantly against a local SymbolCatalog, so that search works even when I have no internet connection.
7. As a crypto trader, I want to remove a Symbol from my Watchlist, so that I can keep it focused on the coins I care about.
8. As a crypto trader, I want to reorder Symbols in my Watchlist via drag-and-drop, so that I can prioritise my most-watched Symbols at the top.
9. As a crypto trader, I want to see a candlestick chart (Kline series) for a Symbol on the ChartScreen, so that I can read price action history.
10. As a crypto trader, I want the chart to load the 500 most recent Klines for the active Symbol and Interval, so that I have sufficient history for technical analysis.
11. As a crypto trader, I want the most recent candle on the chart to update live as new trades arrive via WebSocket, so that the chart reflects the current market in real time.
12. As a crypto trader, I want to pinch-to-zoom and pan the chart, so that I can focus on specific time periods.
13. As a crypto trader, I want a crosshair to appear when I long-press the chart, so that I can read exact OHLCV values for any candle.
14. As a crypto trader, I want to change the Interval (e.g. 1m, 15m, 1H, 4H, 1D) on the ChartScreen, so that I can view different time resolutions for the same Symbol.
15. As a crypto trader, I want the last-used Interval to be remembered per Symbol, so that reopening a Symbol's ChartScreen restores my preferred resolution.
16. As a crypto trader, I want to star an Interval as a FavoriteInterval, so that it appears in the quick-access row at the top of the interval picker.
17. As a crypto trader, I want FavoriteIntervals to be available across all Symbols, so that my preferred resolutions are always one tap away.
18. As a crypto trader, I want to add a custom Interval not in the default list, so that I can use non-standard resolutions if needed.
19. As a crypto trader, I want to toggle the SMA Indicator on the chart with a configurable period, so that I can visualise the simple moving average.
20. As a crypto trader, I want to toggle the EMA Indicator on the chart with a configurable period, so that I can visualise the exponential moving average.
21. As a crypto trader, I want to toggle Bollinger Bands on the chart with configurable period and standard deviation, so that I can visualise volatility bands.
22. As a crypto trader, I want to see Volume bars in a sub-pane below the chart, so that I can correlate price moves with trading volume.
23. As a crypto trader, I want to toggle the RSI Indicator in a sub-pane with configurable overbought/oversold levels, so that I can identify momentum extremes.
24. As a crypto trader, I want to toggle the MACD Indicator in a sub-pane, so that I can identify trend direction and momentum shifts.
25. As a crypto trader, I want Indicator visibility and IndicatorConfig parameters to be saved per Symbol, so that reopening a Symbol's ChartScreen restores my exact indicator setup.
26. As a crypto trader, I want to draw a horizontal line on the chart, so that I can mark key support and resistance levels.
27. As a crypto trader, I want to draw a trend line between two points on the chart, so that I can mark price trends and channels.
28. As a crypto trader, I want to draw a Fibonacci retracement between two points on the chart, so that I can identify potential reversal levels.
29. As a crypto trader, I want my Drawings to be persisted per Symbol, so that they are still visible the next time I open the ChartScreen.
30. As a crypto trader, I want to delete a Drawing by selecting and removing it, so that I can keep the chart clean.
31. As a crypto trader, I want to see a coin icon next to each Symbol in the Watchlist and ChartScreen header, so that I can visually identify Symbols quickly.
32. As a crypto trader, I want a fallback symbol-initial placeholder (e.g. "BTC") if the icon fails to load, so that the UI is never broken by a missing image.
33. As a crypto trader, I want the app to show cached Watchlist prices and ChartScreen Klines when I am offline, so that I can still review the market without an internet connection.
34. As a crypto trader, I want to see a "Last updated X minutes ago" banner when viewing stale cached data, so that I know the data is not live.
35. As a crypto trader, I want the app to reconnect automatically when connectivity is restored, so that live data resumes without me having to restart the app.
36. As a crypto trader, I want the SymbolCatalog to refresh daily in the background, so that newly listed Binance Symbols appear in CoinSearchSheet over time.
37. As a crypto trader, I want the app to work on Android 10 (API 29) and above, so that I can use it on my current device.
38. As a crypto trader, I want the app to work on iOS 16 and above, so that I can use it on my iPhone.
39. As a crypto trader, I want a Settings screen where I can manage FavoriteIntervals and app preferences, so that I can customise the app to my workflow.

## Implementation Decisions

### Module Structure (Clean Architecture + KMP)

Three shared modules following Clean Architecture layer separation:

- **`:shared:domain`** — pure Kotlin, zero framework dependencies. Contains domain models (`Symbol`, `Kline`, `Ticker`, `Interval`, `Indicator`, `IndicatorConfig`, `WatchlistEntry`, `Drawing`, `FavoriteInterval`, `KlineWindow`), repository interfaces (`WatchlistRepository`, `MarketRepository`, `SettingsRepository`), and use cases (`ObserveWatchlistUseCase`, `ObserveTickersUseCase`, `GetKlineWindowUseCase`, `ComputeIndicatorUseCase`, `ManageDrawingsUseCase`, etc.).

- **`:shared:data`** — implements repository interfaces from `:shared:domain`. Contains: Ktor HTTP client (Binance REST — `exchangeInfo`, klines endpoint), Ktor WebSocket client (Binance ticker stream, kline stream), SQLDelight database schema (Watchlist, Kline cache, SymbolCatalog, Drawings, Settings). WebSocket streams are exposed as `SharedFlow` using `shareIn(SharingStarted.WhileSubscribed(5000))` so multiple collectors share one connection and it closes 5s after the last unsubscribes.

- **`:shared:presentation`** — ViewModels using `StateFlow` built on top of `:shared:domain` use cases. One ViewModel per screen: `WatchlistViewModel`, `ChartViewModel`, `SettingsViewModel`, `CoinSearchViewModel`. Exposed to iOS via SKIE (Touchlab) which converts `StateFlow` to native Swift `AsyncStream` automatically.

Platform modules own only native UI:
- **`:androidApp`** — Jetpack Compose UI, Koin Android initialisation
- **`:iosApp`** — SwiftUI, Koin iOS initialisation

Dependency injection: Koin, with one module per shared layer, initialized at each platform entry point.

### Chart Rendering

The ChartScreen embeds TradingView Lightweight Charts (JS library) in a platform WebView (`WebView` on Android, `WKWebView` on iOS). Kotlin communicates with the chart via `evaluateJavascript`, calling named JS functions with JSON payloads:

- `initChart(klines, indicators)` — called on ChartScreen open with full KlineWindow + all active Indicator series
- `updateCandle(kline)` — called on each live WebSocket Kline update
- `setIndicator(name, config, series)` — called when user toggles or reconfigures an Indicator
- `setInterval(interval)` — called when user changes Interval (triggers new REST fetch + re-init)
- `addDrawing(type, points)` / `removeDrawing(id)` — called for Drawing operations

All payloads serialized with `kotlinx.serialization`.

### Indicator Architecture

`Indicator` is an interface in `:shared:domain` that takes a `KlineWindow` and returns a map of named value series. Built-in V1 implementations: `SmaIndicator`, `EmaIndicator`, `BollingerBandsIndicator`, `VolumeIndicator`, `RsiIndicator`, `MacdIndicator`. In V2, a Pine Script interpreter will be an additional `Indicator` implementation without touching the chart bridge.

### Data Flow — Watchlist Screen

1. `WatchlistViewModel` collects `WatchlistRepository.observeWatchlist()` (SQLDelight Flow)
2. Separately collects `MarketRepository.observeTickers()` (Binance `!miniTicker@arr` WebSocket stream)
3. Combines both into a single `WatchlistState` StateFlow emitted to the UI

### Data Flow — ChartScreen

1. `ChartViewModel` fetches KlineWindow via REST on open (500 klines, `symbol + interval`)
2. Stores KlineWindow in SQLDelight cache
3. Subscribes to `MarketRepository.observeKlines(symbol, interval)` WebSocket stream for live candle updates
4. Computes all active Indicator series from the KlineWindow via `ComputeIndicatorUseCase`
5. Pushes full `ChartState` (klines + indicator series + drawings) to the WebView on first render via `initChart`
6. Pushes incremental updates via `updateCandle` on each WebSocket event

### Offline Behaviour

All Kline data and SymbolCatalog are cached in SQLDelight. On load, data is served from cache first, then refreshed from network. A `isStale: Boolean` flag in `ChartState` and `WatchlistState` drives the "Last updated X ago" banner. Network state is observed via platform connectivity APIs (`expect/actual`).

### Coin Icons

Icons loaded from Binance CDN URL pattern per Symbol. On load failure, a text placeholder showing the base currency abbreviation (e.g. "BTC") is shown. Loaded with Coil (Android) and Kingfisher (iOS).

### Persistence Schema (SQLDelight)

Four tables:
- `watchlist_entry` — symbol, display_order, last_interval
- `indicator_config` — symbol, indicator_name, params_json, is_visible
- `kline_cache` — symbol, interval, open_time, open, high, low, close, volume
- `symbol_catalog` — symbol, base_asset, quote_asset, last_updated
- `drawing` — id, symbol, type, points_json
- `favorite_interval` — interval, display_order
- `settings` — key, value

## Testing Decisions

Good tests verify observable behaviour, not implementation details. Tests should not mock internal classes — only external boundaries (network, database). The goal is: if the implementation changes internally but behaviour is identical, tests should still pass.

### Test libraries

- **MockK** — mocking library for Kotlin. Used to mock external boundaries (Binance API client, platform connectivity) in unit tests. Do not mock internal domain classes or repository interfaces — use fakes (hand-written in-memory implementations) instead.
- **Turbine** (Cash App) — Flow testing library. Used in ViewModel tests to assert on `StateFlow` emissions with `test { awaitItem() }` syntax. Replaces manual `collectLatest` + `Channel` boilerplate.
- **kotlinx-coroutines-test** — `TestScope`, `runTest`, `TestDispatcher`. All ViewModels and use cases that use coroutines are tested with a `TestCoroutineDispatcher` to control time and avoid real delays.
- **SQLDelight in-memory driver** — `JdbcSqliteDriver(JdbcSqliteDriver.IN_MEMORY)` for repository integration tests. No mocking of the database — tests exercise real SQL queries.
- **JUnit 5** — test runner for all shared module tests (`commonTest`).

### V1: Unit and integration tests

**`:shared:domain` use cases** — the highest-value test target. Use cases are pure functions or simple coroutine classes with no framework dependencies. Test with real domain objects; no mocks needed. Examples:
- `ComputeIndicatorUseCase` — given a known KlineWindow, assert SMA/RSI/MACD output values match hand-calculated expected results
- `ObserveWatchlistUseCase` — given a fake `WatchlistRepository`, assert emitted state reflects add/remove operations correctly

**`:shared:data` repositories (integration)** — test against an in-memory SQLDelight database. Verify that: Klines written to cache are returned on read; SymbolCatalog search filters correctly; WatchlistEntry ordering is preserved. Use MockK only for the Ktor HTTP/WebSocket client boundary.

**`:shared:presentation` ViewModels** — test with `kotlinx-coroutines-test` + Turbine. Fake repository implementations stand in for the data layer (no MockK needed here — fakes are more readable for stateful flows). Assert `WatchlistViewModel` emits correct `WatchlistState` when Tickers arrive. Assert `ChartViewModel` emits `isStale = true` when the fake repository signals offline state.

**Indicator computation** — unit tests for each `Indicator` implementation. Given a synthetic KlineWindow with known values, assert computed series output matches expected values. These are pure functions — no dependencies, no mocks.

**JS bridge contract** — the HTML/JS page hosting TradingView Lightweight Charts has its own isolated tests (Jest) verifying that calling `initChart`, `updateCandle`, `setIndicator` with valid JSON payloads produces the correct chart state. These run in a Node/browser environment independently of Kotlin.

### V2: UI tests (future extension)

- **Android** — Jetpack Compose UI tests (`androidx.compose.ui.test`). Test Watchlist row rendering, CoinSearchSheet filtering, ChartScreen indicator toggle interactions.
- **iOS** — XCTest UI tests. Mirror the same user flows on the SwiftUI side.
- UI tests target observable screen behaviour only (what the user sees), never internal ViewModel or repository state.
- UI test infrastructure (test doubles for network, deterministic data seeds) will be designed when V2 UI testing is prioritised — not retrofitted onto V1 production code.

## Out of Scope

- User accounts, authentication, or cloud sync — all state is local to the device (V1)
- Pine Script or user-scriptable indicators — V2 feature
- Drawing tools beyond horizontal line, trend line, and Fibonacci retracement
- Date range selector — V1 uses a fixed 500-candle window
- Community features (shared charts, comments, social feed)
- Trading execution or order placement
- Portfolio tracking or P&L calculation
- Price alerts or push notifications
- Multiple watchlists
- Dark/light theme toggle — dark theme only in V1
- Tablet or landscape-optimised layouts

## Further Notes

- The `Indicator` interface must be defined in `:shared:domain` from day one — even though V1 only has built-in implementations — so that V2's Pine Script interpreter can be added without touching the chart bridge or data pipeline (ADR-0002).
- SKIE (Touchlab) is a Gradle plugin added to the `:iosApp` build. It transforms all `StateFlow` and coroutine-returning functions in the compiled KMP framework into native Swift `AsyncStream` / `async` automatically. No hand-written Swift wrapper classes are needed (ADR-0003).
- The WebSocket connection lifecycle is managed by `shareIn(SharingStarted.WhileSubscribed(5000))` in `MarketRepositoryImpl`. This means: multiple screen collectors share a single connection; the connection closes 5 seconds after the last collector unsubscribes (e.g. app backgrounds); it reconnects on the next subscription. No explicit lifecycle management is needed in ViewModels.
- Koin DI modules are defined in each shared layer (`:shared:data`, `:shared:domain`, `:shared:presentation`) and combined at the platform entry point (`Application.onCreate` on Android, `@main` on iOS). This keeps the DI graph verifiable without platform-specific wiring.
