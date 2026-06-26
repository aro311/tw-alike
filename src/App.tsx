import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store'
import { useBinanceTicker } from '@/hooks/useBinanceTicker'
import { useBinanceKlines } from '@/hooks/useBinanceKlines'
import { ChartPanel } from '@/components/chart/ChartPanel'
import { IntervalPicker } from '@/components/chart/IntervalPicker'
import { WatchlistPanel } from '@/components/watchlist/WatchlistPanel'

export default function App() {
  const { activeSymbol, watchlist, getSymbolSettings, setInterval } = useAppStore()
  const symbols = watchlist.map((e) => e.symbol)
  const tickers = useBinanceTicker(symbols)
  const settings = getSymbolSettings(activeSymbol)
  const { klines, loading } = useBinanceKlines(activeSymbol, settings.interval)

  const ticker = tickers[activeSymbol]
  const change = ticker ? parseFloat(ticker.priceChangePercent) : null
  const isPositive = change !== null && change >= 0

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
            <ChartPanel klines={klines} loading={loading} />
          </div>

          {/* Watchlist */}
          <WatchlistPanel tickers={tickers} />
        </div>
      </div>
    </TooltipProvider>
  )
}
