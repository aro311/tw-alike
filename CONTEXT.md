# TWAlike

A Kotlin Multiplatform app for cryptocurrency charting, inspired by TradingView and Binance. Targets Android (API 29+) and iOS (16+) from a single shared codebase with native UI per platform (Jetpack Compose on Android, SwiftUI on iOS). Focuses on real-time price data, candlestick charts, and technical indicators.

Bundle ID: `com.twalike`

## Language

### Market Data

**Symbol**: A tradeable pair on Binance, e.g. `BTCUSDT`, `ETHUSDT`.
_Avoid_: Coin, ticker, pair, asset

**Kline**: A single OHLCV candlestick data point — open, high, low, close, volume — for a given Symbol and Interval.
_Avoid_: Candle, bar, OHLCV

**Interval**: The time resolution of a Kline series, e.g. `1m`, `15m`, `1H`, `4H`, `1D`.
_Avoid_: Timeframe, resolution, period

**Ticker**: A real-time price snapshot for a Symbol, streamed via WebSocket. Contains last price, 24h change, 24h volume.
_Avoid_: Price update, quote

**KlineWindow**: The fixed set of 500 most recent Klines fetched for a given Symbol + Interval combination.
_Avoid_: Date range, history, chart data

### Watchlist

**Watchlist**: The user's personal list of Symbols they have chosen to monitor. Pre-populated on first launch with `BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT`.
_Avoid_: Portfolio, favorites list, tracked coins

**WatchlistEntry**: A single Symbol in the Watchlist, with its display order, last-used Interval, and associated IndicatorConfigs.
_Avoid_: Watchlist item, coin row

### Chart

**Indicator**: A named series of computed values derived from Kline data, rendered as an overlay or sub-pane on the Chart. V1 built-in set: SMA, EMA, Bollinger Bands (overlays); Volume, RSI, MACD (sub-panes).
_Avoid_: Study, signal, overlay

**IndicatorConfig**: The user's parameter settings for a specific Indicator on a specific Symbol (e.g. SMA period = 20, RSI overbought = 70). Persisted per WatchlistEntry.
_Avoid_: Indicator settings, indicator parameters

**FavoriteInterval**: An Interval the user has starred for quick access in the interval picker. Global across all Symbols.
_Avoid_: Pinned interval, saved interval

**Drawing**: A user-placed annotation on the Chart — one of: horizontal line, trend line, or Fibonacci retracement. Persisted per Symbol in SQLDelight.
_Avoid_: Annotation, markup, line

### Navigation

**ChartScreen**: The full-screen view showing the candlestick chart for a single Symbol, with Indicators, Interval picker, and Drawing tools.
_Avoid_: Chart page, trading view

**CoinSearchSheet**: The modal bottom sheet triggered by the `+` button on the Watchlist screen, used to search and add Symbols to the Watchlist. Searches locally against the cached SymbolCatalog.
_Avoid_: Search screen, add coin dialog

**SymbolCatalog**: The full list of tradeable Symbols fetched from Binance `exchangeInfo` endpoint, cached in SQLDelight and refreshed daily. Powers CoinSearchSheet search.
_Avoid_: Coin list, exchange info, symbol list

## Example dialogue

> **Dev:** When the user taps a row in the Watchlist, what opens?
> **Domain expert:** The ChartScreen for that Symbol.
>
> **Dev:** If the user changes the Interval on the ChartScreen, does that change the Interval for all Symbols or just this one?
> **Domain expert:** Just this Symbol's WatchlistEntry — the last-used Interval is stored per WatchlistEntry.
>
> **Dev:** What's the difference between a Ticker and a Kline?
> **Domain expert:** A Ticker is a live price snapshot arriving every second via WebSocket — it updates the price shown in the Watchlist row. A Kline is a historical candlestick data point — a KlineWindow of 500 Klines forms the chart series.
>
> **Dev:** What happens when the app goes offline?
> **Domain expert:** The Watchlist shows the last-known Ticker prices greyed out. The ChartScreen shows the cached KlineWindow with a stale timestamp banner. WebSocket reconnects automatically when connectivity returns.
>
> **Dev:** How does a user add a coin not in the default Watchlist?
> **Domain expert:** They tap `+` on the Watchlist header, which opens CoinSearchSheet. Search runs locally against the SymbolCatalog. Selecting a Symbol adds a new WatchlistEntry.
