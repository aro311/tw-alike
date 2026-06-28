import { useEffect, useRef, useState, useCallback } from 'react'
import type { IChartApi, LogicalRange } from 'lightweight-charts'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useBinanceTicker } from '@/hooks/useBinanceTicker'
import { useBinanceKlines } from '@/hooks/useBinanceKlines'
import { useDailyOpen } from '@/hooks/useDailyOpen'
import { ChartPanel } from '@/components/chart/ChartPanel'
import { IntervalPicker } from '@/components/chart/IntervalPicker'
import { VwapSelector } from '@/components/chart/VwapSelector'
import { RsiPanel } from '@/components/chart/RsiPanel'
import { WatchlistPanel } from '@/components/watchlist/WatchlistPanel'

const RSI_MIN_PX = 80
const RSI_DEFAULT_RATIO = 0.28 // RSI panel takes 28% of chart area height

export default function App() {
  const { activeSymbol, watchlist, getSymbolSettings, setInterval, vwapEnabled, vwapAnchor, setVwapEnabled, setVwapAnchor } = useAppStore()
  const tickers = useBinanceTicker(watchlist)
  const dailyOpens = useDailyOpen(watchlist)
  const settings = getSymbolSettings(activeSymbol)
  const activeMarket = watchlist.find((e) => e.symbol === activeSymbol)?.market ?? 'spot'
  const { klines, liveCandle, loading } = useBinanceKlines(activeSymbol, settings.interval, activeMarket)

  const ticker = tickers[activeSymbol]
  const dailyOpen = dailyOpens[activeSymbol]
  const change = ticker && dailyOpen
    ? (parseFloat(ticker.price) - dailyOpen) / dailyOpen * 100
    : null
  const isPositive = change !== null && change >= 0

  useEffect(() => {
    if (!ticker) { document.title = 'TWAlike'; return }
    const symbolDisplay = activeMarket === 'futures' ? `${activeSymbol}.P` : activeSymbol
    const price = parseFloat(ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 })
    if (change !== null) {
      const arrow = isPositive ? '▲' : '▼'
      const pct = `${isPositive ? '+' : ''}${change.toFixed(2)}%`
      document.title = `${symbolDisplay} ${price} ${arrow} ${pct}`
    } else {
      document.title = `${symbolDisplay} ${price}`
    }
  }, [ticker, activeSymbol, activeMarket, change, isPositive])

  // ── RSI panel drag-to-resize ─────────────────────────────────────────────
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [rsiRatio, setRsiRatio] = useState(RSI_DEFAULT_RATIO)
  const dragging = useRef(false)

  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !chartAreaRef.current) return
      const rect = chartAreaRef.current.getBoundingClientRect()
      const totalH = rect.height
      const fromBottom = rect.bottom - ev.clientY
      const ratio = Math.min(Math.max(fromBottom / totalH, RSI_MIN_PX / totalH), 0.6)
      setRsiRatio(ratio)
    }

    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  // ── Time scale sync: main → RSI ─────────────────────────────────────────
  const mainChartRef = useRef<IChartApi | null>(null)
  const rsiChartRef = useRef<IChartApi | null>(null)
  const [syncRange, setSyncRange] = useState<LogicalRange | null>(null)
  const syncing = useRef(false)

  const handleMainChartReady = useCallback((chart: IChartApi) => {
    mainChartRef.current = chart
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncing.current || !range) return
      syncing.current = true
      setSyncRange(range)
      rsiChartRef.current?.timeScale().setVisibleLogicalRange(range)
      syncing.current = false
    })
  }, [])

  const handleRsiChartReady = useCallback((chart: IChartApi) => {
    rsiChartRef.current = chart
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncing.current || !range) return
      syncing.current = true
      mainChartRef.current?.timeScale().setVisibleLogicalRange(range)
      syncing.current = false
    })
  }, [])

  const rsiConfig = settings.indicators.find((i) => i.type === 'RSI')

  return (
    <TooltipProvider>
      <div className="flex flex-col w-full h-full bg-[#0f1117]">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0">
          <h1 className="text-sm font-bold text-white tracking-tight">TWAlike</h1>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-sm font-semibold text-white">
            {activeSymbol.replace('USDT', '/USDT')}
          </span>
          {activeMarket === 'futures' && (
            <span className="text-xs font-medium text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">PERP</span>
          )}
          {ticker && (
            <>
              <span className="text-sm font-medium text-white">
                ${parseFloat(ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{change?.toFixed(2)}%
              </span>
            </>
          )}
        </header>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Chart area */}
          <div className="flex flex-col flex-1 min-w-0">
            <IntervalPicker
              value={settings.interval}
              onChange={(interval) => setInterval(activeSymbol, interval)}
              rightSlot={
                <VwapSelector
                  enabled={vwapEnabled}
                  anchor={vwapAnchor}
                  onToggle={() => setVwapEnabled(!vwapEnabled)}
                  onAnchorChange={setVwapAnchor}
                />
              }
            />

            {/* Candlestick + RSI stacked */}
            <div ref={chartAreaRef} className="flex flex-col flex-1 min-h-0">
              {/* Candlestick chart */}
              <div style={{ flex: `1 1 ${(1 - rsiRatio) * 100}%` }} className="min-h-0 flex flex-col">
                <ChartPanel
                  klines={klines}
                  liveCandle={liveCandle}
                  loading={loading}
                  onChartReady={handleMainChartReady}
                  vwapEnabled={vwapEnabled}
                  vwapAnchor={vwapAnchor}
                />
              </div>

              {/* Drag divider */}
              <div
                onMouseDown={onDividerMouseDown}
                className="h-1 bg-slate-800 hover:bg-blue-600/50 cursor-row-resize shrink-0 transition-colors"
              />

              {/* RSI panel */}
              <div style={{ flex: `0 0 ${rsiRatio * 100}%` }} className="min-h-0 flex flex-col">
                <RsiPanel
                  klines={klines}
                  liveCandle={liveCandle}
                  period={rsiConfig?.period ?? 14}
                  overbought={rsiConfig?.overbought ?? 70}
                  oversold={rsiConfig?.oversold ?? 30}
                  onChartReady={handleRsiChartReady}
                  syncRange={syncRange}
                />
              </div>
            </div>
          </div>

          {/* Watchlist */}
          <WatchlistPanel tickers={tickers} dailyOpens={dailyOpens} />
        </div>
      </div>
    </TooltipProvider>
  )
}
