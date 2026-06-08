# Clean Architecture with layered KMP modules

The shared codebase is split into three layers following Clean Architecture:

- `:shared:data` — Binance REST + WebSocket clients (Ktor), SQLDelight database, repository implementations. No domain or presentation imports.
- `:shared:domain` — pure Kotlin models (Symbol, Kline, Ticker, Indicator, WatchlistEntry), repository interfaces, use cases. Zero framework dependencies.
- `:shared:presentation` — ViewModels using `StateFlow` from `:shared:domain` use cases. Exposed to platform UIs via SKIE (iOS) and collected directly (Android).

Platform apps (`:androidApp`, `:iosApp`) own only native UI: Jetpack Compose on Android, SwiftUI on iOS. No business logic lives in the platform modules.

Dependency injection across all shared modules uses Koin, initialized once at each platform entry point.

## Considered Options

- **Compose Multiplatform (shared UI)** — rejected in favour of native UI per platform: Jetpack Compose on Android, SwiftUI on iOS. The custom dark-themed chart UI does not benefit enough from UI sharing to outweigh idiomatic native feel on each platform.
- **Feature-based module split** — rejected in favour of layered split. Layers are simpler to reason about for a small team; feature boundaries can be introduced later if needed.
