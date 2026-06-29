import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Interval, IndicatorConfig, Drawing, WatchlistEntry, SymbolSettings, Market, VwapAnchor } from '@/types'

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { type: 'SMA', enabled: false, period: 20 },
  { type: 'EMA', enabled: false, period: 20 },
  { type: 'BB', enabled: false, period: 20, stdDev: 2 },
  { type: 'VOLUME', enabled: true },
  { type: 'RSI', enabled: false, period: 14, overbought: 70, oversold: 30 },
  { type: 'MACD', enabled: false },
]

const DEFAULT_WATCHLIST: WatchlistEntry[] = [
  { symbol: 'BTCUSDT', addedAt: Date.now(), market: 'spot' },
  { symbol: 'ETHUSDT', addedAt: Date.now(), market: 'spot' },
  { symbol: 'BNBUSDT', addedAt: Date.now(), market: 'spot' },
  { symbol: 'SOLUSDT', addedAt: Date.now(), market: 'spot' },
  { symbol: 'XRPUSDT', addedAt: Date.now(), market: 'spot' },
]

interface AppState {
  watchlist: WatchlistEntry[]
  activeSymbol: string
  symbolSettings: Record<string, SymbolSettings>
  watchlistPanelMode: 'list' | 'icons' | 'hidden'
  vwapEnabled: boolean
  vwapAnchor: VwapAnchor
  blEnabled: boolean
  blSlowEnabled: boolean

  setActiveSymbol: (symbol: string) => void
  setVwapEnabled: (enabled: boolean) => void
  setVwapAnchor: (anchor: VwapAnchor) => void
  setBlEnabled: (enabled: boolean) => void
  setBlSlowEnabled: (enabled: boolean) => void
  addToWatchlist: (symbol: string, market: Market) => void
  removeFromWatchlist: (symbol: string) => void
  reorderWatchlist: (from: number, to: number) => void
  setWatchlistPanelMode: (mode: 'list' | 'icons' | 'hidden') => void

  getSymbolSettings: (symbol: string) => SymbolSettings
  setInterval: (symbol: string, interval: Interval) => void
  toggleIndicator: (symbol: string, type: IndicatorConfig['type']) => void
  updateIndicatorConfig: (symbol: string, config: Partial<IndicatorConfig> & { type: IndicatorConfig['type'] }) => void
  addDrawing: (symbol: string, drawing: Drawing) => void
  removeDrawing: (symbol: string, id: string) => void
}

const defaultSymbolSettings = (): SymbolSettings => ({
  interval: '1h',
  indicators: DEFAULT_INDICATORS.map(i => ({ ...i })),
  drawings: [],
})

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: DEFAULT_WATCHLIST,
      activeSymbol: 'BTCUSDT',
      symbolSettings: {},
      watchlistPanelMode: 'list',
      vwapEnabled: true,
      vwapAnchor: 'W',
      blEnabled: true,
      blSlowEnabled: true,

      setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
      setVwapEnabled: (vwapEnabled) => set({ vwapEnabled }),
      setVwapAnchor: (vwapAnchor) => set({ vwapAnchor }),
      setBlEnabled: (blEnabled) => set({ blEnabled }),
      setBlSlowEnabled: (blSlowEnabled) => set({ blSlowEnabled }),

      addToWatchlist: (symbol, market) =>
        set((s) => ({
          watchlist: s.watchlist.some((e) => e.symbol === symbol)
            ? s.watchlist
            : [...s.watchlist, { symbol, market, addedAt: Date.now() }],
        })),

      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((e) => e.symbol !== symbol) })),

      reorderWatchlist: (from, to) =>
        set((s) => {
          const list = [...s.watchlist]
          const [item] = list.splice(from, 1)
          list.splice(to, 0, item)
          return { watchlist: list }
        }),

      setWatchlistPanelMode: (mode) => set({ watchlistPanelMode: mode }),

      getSymbolSettings: (symbol) =>
        get().symbolSettings[symbol] ?? defaultSymbolSettings(),

      setInterval: (symbol, interval) =>
        set((s) => ({
          symbolSettings: {
            ...s.symbolSettings,
            [symbol]: { ...s.getSymbolSettings(symbol), interval },
          },
        })),

      toggleIndicator: (symbol, type) =>
        set((s) => {
          const settings = s.getSymbolSettings(symbol)
          return {
            symbolSettings: {
              ...s.symbolSettings,
              [symbol]: {
                ...settings,
                indicators: settings.indicators.map((ind) =>
                  ind.type === type ? { ...ind, enabled: !ind.enabled } : ind
                ),
              },
            },
          }
        }),

      updateIndicatorConfig: (symbol, config) =>
        set((s) => {
          const settings = s.getSymbolSettings(symbol)
          return {
            symbolSettings: {
              ...s.symbolSettings,
              [symbol]: {
                ...settings,
                indicators: settings.indicators.map((ind) =>
                  ind.type === config.type ? { ...ind, ...config } : ind
                ),
              },
            },
          }
        }),

      addDrawing: (symbol, drawing) =>
        set((s) => {
          const settings = s.getSymbolSettings(symbol)
          return {
            symbolSettings: {
              ...s.symbolSettings,
              [symbol]: { ...settings, drawings: [...settings.drawings, drawing] },
            },
          }
        }),

      removeDrawing: (symbol, id) =>
        set((s) => {
          const settings = s.getSymbolSettings(symbol)
          return {
            symbolSettings: {
              ...s.symbolSettings,
              [symbol]: {
                ...settings,
                drawings: settings.drawings.filter((d) => d.id !== id),
              },
            },
          }
        }),
    }),
    { name: 'twalike-state' }
  )
)
