# Chart rendering via TradingView Lightweight Charts in WebView

We use TradingView Lightweight Charts (JS library) embedded in a platform WebView rather than drawing charts natively in Compose Multiplatform canvas. The library is production-grade, feature-complete (pinch-zoom, crosshair, multi-pane indicators), and matches the target UX exactly. Building an equivalent chart engine from scratch in Compose canvas would take 4–8 weeks and produce an inferior result.

## Considered Options

- **Compose Multiplatform canvas** — rejected: enormous build cost for a feature TradingView already solved
- **Native chart library per platform** — rejected: defeats KMP code sharing, integration written twice
