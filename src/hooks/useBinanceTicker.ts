import { useEffect, useRef, useState } from 'react'
import type { Ticker, WatchlistEntry } from '@/types'

export function useBinanceTicker(entries: WatchlistEntry[]) {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({})

  // ── Spot: WebSocket all-market stream ───────────────────────────────────
  const spotKey = entries
    .filter((e) => (e.market ?? 'spot') === 'spot')
    .map((e) => e.symbol.toLowerCase())
    .join(',')
  const spotSet = useRef(new Set(spotKey.split(',').filter(Boolean)))

  useEffect(() => {
    spotSet.current = new Set(spotKey.split(',').filter(Boolean))
  }, [spotKey])

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr')
    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as { s: string; c: string; o: string; v: string }[]
      setTickers((prev) => {
        const next = { ...prev }
        for (const t of data) {
          if (spotSet.current.has(t.s.toLowerCase())) {
            next[t.s] = { symbol: t.s, price: t.c, open24h: t.o, volume: t.v }
          }
        }
        return next
      })
    }
    return () => { ws.onmessage = null; ws.close() }
  }, [])

  // ── Futures: REST polling every 2s (fstream.binance.com is geo-blocked) ─
  const futuresKey = entries
    .filter((e) => e.market === 'futures')
    .map((e) => e.symbol.toUpperCase())
    .join(',')

  useEffect(() => {
    if (!futuresKey) return
    const symbols = futuresKey.split(',')

    const poll = async () => {
      await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const res = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`)
            const d = await (res.json() as Promise<{
              symbol: string; lastPrice: string; openPrice: string; volume: string
            }>)
            setTickers((prev) => ({
              ...prev,
              [d.symbol]: { symbol: d.symbol, price: d.lastPrice, open24h: d.openPrice, volume: d.volume },
            }))
          } catch { /* skip on network error */ }
        })
      )
    }

    void poll()
    const id = setInterval(() => void poll(), 2000)
    return () => clearInterval(id)
  }, [futuresKey])

  return tickers
}
