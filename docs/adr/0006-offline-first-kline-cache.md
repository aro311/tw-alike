# Offline-first: Kline history and SymbolCatalog cached in SQLDelight

All Kline data (KlineWindows) and the SymbolCatalog are persisted in SQLDelight on-device. When the network is unavailable, the app renders the last-cached KlineWindow with a stale timestamp indicator rather than showing an error screen. The SymbolCatalog is refreshed daily; KlineWindows are refreshed on each ChartScreen open. WebSocket connections (Ticker stream, live Kline updates) reconnect automatically via `shareIn(SharingStarted.WhileSubscribed(5000))` when connectivity returns.

No user account or cloud sync exists in V1 — all state is local to the device.
