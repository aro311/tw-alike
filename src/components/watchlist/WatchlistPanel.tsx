import { useAppStore } from '@/store'
import type { Ticker } from '@/types'
import { Badge } from '@/components/ui/badge'

interface Props {
  tickers: Record<string, Ticker>
}

export function WatchlistPanel({ tickers }: Props) {
  const { watchlist, activeSymbol, watchlistPanelMode, setActiveSymbol, setWatchlistPanelMode } =
    useAppStore()

  if (watchlistPanelMode === 'hidden') return null

  const isIconMode = watchlistPanelMode === 'icons'

  return (
    <div
      className={`flex flex-col border-l border-slate-800 bg-[#0f1117] transition-all ${
        isIconMode ? 'w-14' : 'w-52'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
        {!isIconMode && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Watchlist
          </span>
        )}
        <button
          onClick={() =>
            setWatchlistPanelMode(isIconMode ? 'list' : 'icons')
          }
          className="ml-auto text-slate-500 hover:text-white text-xs px-1"
          title={isIconMode ? 'Expand' : 'Collapse'}
        >
          {isIconMode ? '»' : '«'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {watchlist.map((entry) => {
          const ticker = tickers[entry.symbol]
          const change = ticker ? parseFloat(ticker.priceChangePercent) : null
          const isPositive = change !== null && change >= 0
          const isActive = entry.symbol === activeSymbol
          const base = entry.symbol.replace('USDT', '').replace('BTC', '')

          if (isIconMode) {
            return (
              <button
                key={entry.symbol}
                onClick={() => setActiveSymbol(entry.symbol)}
                className={`w-full flex items-center justify-center py-3 text-xs font-bold transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
                title={entry.symbol}
              >
                {base.slice(0, 3)}
              </button>
            )
          }

          return (
            <button
              key={entry.symbol}
              onClick={() => setActiveSymbol(entry.symbol)}
              className={`w-full flex flex-col px-3 py-2.5 text-left transition-colors border-b border-slate-800/50 ${
                isActive ? 'bg-slate-800' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium text-white">
                  {entry.symbol.replace('USDT', '')}
                </span>
                {change !== null && (
                  <Badge
                    variant="outline"
                    className={`text-xs px-1.5 py-0 border-0 ${
                      isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
                    }`}
                  >
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </Badge>
                )}
              </div>
              {ticker && (
                <span className="text-xs text-slate-400 mt-0.5">
                  ${parseFloat(ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
