# Indicator interface abstracted from day one for V2 scriptability

V1 ships a fixed built-in set of indicators (SMA, EMA, RSI, MACD, Bollinger Bands, Volume). However, the `Indicator` interface — which takes Kline data and returns named value series — is defined in `:shared:domain` as an abstraction from day one. Built-in indicators are concrete implementations. In V2, a Pine Script interpreter will be another implementation of the same interface. Without this boundary, adding V2 scripting would require rewriting the entire chart data pipeline.
