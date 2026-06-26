import { useEffect, useRef, useState, useCallback } from 'react'
import type { Kline, Interval } from '@/types'

const BINANCE_REST = 'https://api3.binance.com'

export function useBinanceKlines(symbol: string, interval: Interval) {
  const [klines, setKlines] = useState<Kline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveCandle, setLiveCandle] = useState<Kline | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLiveCandle(null)
    try {
      const res = await fetch(
        `${BINANCE_REST}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as [number, string, string, string, string, string, ...unknown[]][]
      setKlines(
        raw.map(([t, o, h, l, c, v]) => ({
          time: t / 1000,
          open: parseFloat(o),
          high: parseFloat(h),
          low: parseFloat(l),
          close: parseFloat(c),
          volume: parseFloat(v),
        }))
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [symbol, interval])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    const stream = `${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`)
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string) as {
        k: { t: number; o: string; h: string; l: string; c: string; v: string }
      }
      const k = msg.k
      setLiveCandle({
        time: k.t / 1000,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      })
    }

    return () => ws.close()
  }, [symbol, interval])

  return { klines, liveCandle, loading, error }
}
