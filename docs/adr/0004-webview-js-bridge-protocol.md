# Kotlin↔TradingView chart bridge via evaluateJavascript + JSON

Kotlin pushes chart data into the TradingView Lightweight Charts WebView by calling `webView.evaluateJavascript("functionName($json)")`. The HTML page exposes a defined JS API: `initChart(klines, indicators)` for initial load, `updateCandle(kline)` for live patches, `setIndicator(name, config, series)` for indicator updates, and `setInterval(interval)` for interval changes. Kotlin serializes all payloads with `kotlinx.serialization`.

This keeps the bridge simple and debuggable — each function call is a single JSON payload, testable in isolation by loading the HTML page in a browser.

## Considered Options

- **Full page reload per update** — rejected: causes flickering, unusable for live candle updates
- **Local WebSocket server** — rejected: adds port management and local server complexity for no benefit over direct JS evaluation
