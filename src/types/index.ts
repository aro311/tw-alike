export interface Kline {
  time: number // Unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Ticker {
  symbol: string
  price: string   // close price from miniTicker `c`
  open24h: string // 24h rolling open from miniTicker `o` (not day open)
  volume: string
}

export type Interval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M'

export type IndicatorType = 'SMA' | 'EMA' | 'BB' | 'RSI' | 'MACD' | 'VOLUME'

export interface IndicatorConfig {
  type: IndicatorType
  enabled: boolean
  period?: number
  stdDev?: number
  overbought?: number
  oversold?: number
}

export interface Drawing {
  id: string
  type: 'horizontal' | 'trendline' | 'fibonacci'
  points: { time: number; value: number }[]
}

export type Market = 'spot' | 'futures'

export interface WatchlistEntry {
  symbol: string
  addedAt: number
  market: Market
}

export interface SymbolSettings {
  interval: Interval
  indicators: IndicatorConfig[]
  drawings: Drawing[]
}
