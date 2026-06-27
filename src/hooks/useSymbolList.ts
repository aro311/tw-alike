import { useEffect, useState } from 'react'
import type { Market } from '@/types'

export interface SymbolInfo {
  symbol: string
  market: Market
}

let cachedList: SymbolInfo[] | null = null
let inflight: Promise<SymbolInfo[]> | null = null

async function loadSymbols(): Promise<SymbolInfo[]> {
  if (cachedList) return cachedList
  if (!inflight) {
    inflight = Promise.all([
      fetch('https://api3.binance.com/api/v3/exchangeInfo?permissions=SPOT')
        .then((r) => r.json() as Promise<{ symbols: { symbol: string; quoteAsset: string; status: string }[] }>)
        .then((data) =>
          data.symbols
            .filter((s) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
            .map((s): SymbolInfo => ({ symbol: s.symbol, market: 'spot' }))
        ),
      fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
        .then((r) => r.json() as Promise<{ symbols: { symbol: string; quoteAsset: string; status: string; contractType: string }[] }>)
        .then((data) =>
          data.symbols
            .filter((s) => s.quoteAsset === 'USDT' && s.status === 'TRADING' && s.contractType === 'PERPETUAL')
            .map((s): SymbolInfo => ({ symbol: s.symbol, market: 'futures' }))
        ),
    ]).then(([spot, futures]) => {
      cachedList = [...spot, ...futures]
      return cachedList
    })
  }
  return inflight
}

export function useSymbolList() {
  const [symbols, setSymbols] = useState<SymbolInfo[]>(cachedList ?? [])
  const [loading, setLoading] = useState(cachedList === null)

  useEffect(() => {
    if (cachedList !== null) return
    void loadSymbols().then((list) => {
      setSymbols(list)
      setLoading(false)
    })
  }, [])

  return { symbols, loading }
}
