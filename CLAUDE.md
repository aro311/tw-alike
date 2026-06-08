# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TWAlike — a Kotlin Multiplatform cryptocurrency charting app (TradingView-style). Android (API 29+) and iOS (16+) with native UI per platform. Bundle ID: `com.twalike`.

See `CONTEXT.md` for the canonical domain glossary. Use its terms (Symbol, Kline, Ticker, Interval, KlineWindow, WatchlistEntry, Indicator, IndicatorConfig, Drawing, FavoriteInterval, SymbolCatalog) throughout all code and comments.

## Commands

> These will be populated once the project is scaffolded. Expected commands:

```bash
# Build shared modules
./gradlew :shared:domain:build
./gradlew :shared:data:build
./gradlew :shared:presentation:build

# Run all shared tests
./gradlew :shared:domain:test
./gradlew :shared:data:test
./gradlew :shared:presentation:test

# Run a single test class
./gradlew :shared:domain:test --tests "com.twalike.domain.indicator.SmaIndicatorTest"

# Build Android app
./gradlew :androidApp:assembleDebug

# Build iOS framework (for Xcode)
./gradlew :shared:assembleXCFramework
```

## Architecture

Clean Architecture with three shared KMP modules and two platform UI modules:

```
:shared:domain        ← pure Kotlin, zero framework deps
:shared:data          ← Ktor + SQLDelight, implements domain interfaces
:shared:presentation  ← StateFlow ViewModels, consumed by platform UIs
:androidApp           ← Jetpack Compose UI only
:iosApp               ← SwiftUI UI only (compiled as XCFramework)
```

**Dependency rule:** `:shared:data` and `:shared:presentation` depend on `:shared:domain`. Platform apps depend on `:shared:presentation`. Nothing in `:shared:domain` imports Ktor, SQLDelight, Android, or iOS APIs.

### Data flow — Watchlist screen

`WatchlistViewModel` combines two flows: `WatchlistRepository.observeWatchlist()` (SQLDelight) and `MarketRepository.observeTickers()` (Binance `!miniTicker@arr` WebSocket stream) into a single `WatchlistState` StateFlow.

### Data flow — ChartScreen

`ChartViewModel` fetches a `KlineWindow` (500 candles) via Binance REST on open, caches it in SQLDelight, subscribes to `MarketRepository.observeKlines(symbol, interval)` WebSocket for live updates, and computes all active Indicator series via `ComputeIndicatorUseCase`. The full state is pushed to the TradingView Lightweight Charts WebView via `evaluateJavascript`.

### WebSocket lifecycle

`MarketRepositoryImpl` exposes streams via `shareIn(SharingStarted.WhileSubscribed(5000))`. Multiple collectors share one connection; it closes 5s after the last unsubscribes and reconnects automatically on the next subscription. ViewModels do not manage connection lifecycle directly.

### Chart rendering

The ChartScreen embeds TradingView Lightweight Charts (JS) in a platform WebView. Kotlin calls named JS functions with JSON payloads: `initChart`, `updateCandle`, `setIndicator`, `setInterval`, `addDrawing`, `removeDrawing`. All payloads use `kotlinx.serialization`.

### Indicator abstraction

`Indicator` is an interface in `:shared:domain`. Built-in V1 implementations: `SmaIndicator`, `EmaIndicator`, `BollingerBandsIndicator`, `VolumeIndicator`, `RsiIndicator`, `MacdIndicator`. Do not hardcode indicator logic into the chart bridge — all indicators go through this interface so V2 Pine Script scripting can be added as another implementation.

### iOS interop

SKIE (Touchlab Gradle plugin) converts all `StateFlow` and suspend functions in the compiled KMP framework to native Swift `AsyncStream`/`async` automatically. Do not write Swift `ObservableObject` wrapper classes — SKIE handles this.

### Dependency injection

Koin. Each shared layer defines its own Koin module. Modules are combined at platform entry points (`Application.onCreate` on Android, `@main` on iOS).

### Offline-first

SQLDelight is the source of truth. Network responses write to the DB; UI reads from the DB. A `isStale: Boolean` in `WatchlistState` and `ChartState` drives the "Last updated X ago" banner when cached data is being shown.

## Testing

- **MockK** — mock only external boundaries (Ktor HTTP/WebSocket client, platform connectivity). Use hand-written fakes for repository interfaces in ViewModel tests.
- **Turbine** — Flow/StateFlow assertions in ViewModel tests (`test { awaitItem() }`).
- **kotlinx-coroutines-test** — `runTest` + `TestCoroutineDispatcher` for all coroutine tests.
- **SQLDelight in-memory driver** — `JdbcSqliteDriver(JdbcSqliteDriver.IN_MEMORY)` for repository integration tests. Do not mock the database.
- **JS bridge tests** — Jest tests for the HTML/JS chart page, run independently of Kotlin.

## Key documentation

- `CONTEXT.md` — domain glossary (canonical terms for all code)
- `docs/PRD.md` — full product requirements and user stories
- `docs/adr/` — architectural decision records; read before changing chart rendering, indicator structure, iOS interop, or module layout
