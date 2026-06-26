import { useEffect, useRef, useState } from 'react'
import type { Ticker } from '@/types'

export function useBinanceTicker(symbols: string[]) {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({})
  const wsRef = useRef<WebSocket | null>(null)
  const symbolSet = useRef(new Set(symbols.map((s) => s.toLowerCase())))

  useEffect(() => {
    symbolSet.current = new Set(symbols.map((s) => s.toLowerCase()))
  }, [symbols])

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr')
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as {
        s: string; c: string; o: string; v: string
      }[]
      setTickers((prev) => {
        const next = { ...prev }
        for (const t of data) {
          if (symbolSet.current.has(t.s.toLowerCase())) {
            next[t.s] = {
              symbol: t.s,
              price: t.c,
              open24h: t.o,
              volume: t.v,
            }
          }
        }
        return next
      })
    }

    return () => ws.close()
  }, [])

  return tickers
}
