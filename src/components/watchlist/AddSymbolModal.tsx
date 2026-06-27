import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { useSymbolList } from '@/hooks/useSymbolList'

interface Props {
  onClose: () => void
}

export function AddSymbolModal({ onClose }: Props) {
  const { watchlist, addToWatchlist, setActiveSymbol } = useAppStore()
  const { symbols, loading } = useSymbolList()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyed by symbol — any market blocks the same symbol in any other market
  const watchlistMap = new Map(watchlist.map((e) => [e.symbol, e.market ?? 'spot']))

  const filtered = query.trim().length > 0
    ? symbols
        .filter((s) => s.symbol.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 60)
    : []

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleAdd = (symbol: string, market: 'spot' | 'futures') => {
    addToWatchlist(symbol, market)
    setActiveSymbol(symbol)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1f2e] border border-slate-700 rounded-lg w-96 max-h-[480px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-3 border-b border-slate-700">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search USDT pairs… e.g. SOL, DOGE, PEPE"
            className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-md outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-slate-400 text-sm p-4">Loading symbol list…</p>
          )}
          {!loading && query.trim() === '' && (
            <p className="text-slate-500 text-xs p-4 text-center">
              Type to search Binance USDT spot &amp; futures pairs
            </p>
          )}
          {!loading && query.trim() !== '' && filtered.length === 0 && (
            <p className="text-slate-400 text-sm p-4">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {filtered.map((info) => {
            const existingMarket = watchlistMap.get(info.symbol)
            const blocked = existingMarket !== undefined
            // Label explaining what's blocking: "SPOT added" or "PERP added"
            const blockLabel = blocked
              ? existingMarket === 'futures' ? 'PERP added' : 'SPOT added'
              : null
            return (
              <button
                key={`${info.symbol}:${info.market}`}
                disabled={blocked}
                onClick={() => handleAdd(info.symbol, info.market)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                  blocked
                    ? 'text-slate-600 cursor-default'
                    : 'text-white hover:bg-slate-700/60 cursor-pointer'
                }`}
              >
                <span className="font-medium">
                  {info.symbol.replace('USDT', '')}
                  <span className={blocked ? 'text-slate-700' : 'text-slate-500'} style={{fontWeight: 'normal'}}>/USDT</span>
                </span>
                <div className="flex items-center gap-2">
                  {info.market === 'futures' && (
                    <span className={`text-xs px-1 py-0.5 rounded ${blocked ? 'text-slate-600 bg-slate-800' : 'text-yellow-400 bg-yellow-400/10'}`}>PERP</span>
                  )}
                  {blockLabel && (
                    <span className="text-xs text-slate-600">{blockLabel}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-slate-800">
          <span className="text-xs text-slate-600">Click to add · ESC to close</span>
        </div>
      </div>
    </div>
  )
}
