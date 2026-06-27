import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useBinanceTicker } from '@/hooks/useBinanceTicker'
import { useBinanceKlines } from '@/hooks/useBinanceKlines'
import { useDailyOpen } from '@/hooks/useDailyOpen'
import { ChartPanel } from '@/components/chart/ChartPanel'
import { IntervalPicker } from '@/components/chart/IntervalPicker'
import { WatchlistPanel } from '@/components/watchlist/WatchlistPanel'

export default function App() {
  const { activeSymbol, watchlist, getSymbolSettings, setInterval } = useAppStore()
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
    const symbol = activeSymbol.replace('USDT', '')
    const price = parseFloat(ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 })
    document.title = `${symbol} $${price} | TWAlike`
  }, [ticker, activeSymbol])

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
            />
            <ChartPanel klines={klines} liveCandle={liveCandle} loading={loading} />
          </div>

          {/* Watchlist */}
          <WatchlistPanel tickers={tickers} dailyOpens={dailyOpens} />
        </div>
      </div>
    </TooltipProvider>
  )
}
