import { useEffect, useRef, useState, useCallback } from 'react'
import type { Kline, Interval, Market } from '@/types'

const REST: Record<Market, string> = {
  spot: 'https://api3.binance.com/api/v3/klines',
  futures: 'https://fapi.binance.com/fapi/v1/klines',
}

function parseKlineRow([t, o, h, l, c, v]: [number, string, string, string, string, string, ...unknown[]]): Kline {
  return {
    time: t / 1000,
    open: parseFloat(o),
    high: parseFloat(h),
    low: parseFloat(l),
    close: parseFloat(c),
    volume: parseFloat(v),
  }
}

export function useBinanceKlines(symbol: string, interval: Interval, market: Market = 'spot') {
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
      const res = await fetch(`${REST[market]}?symbol=${symbol}&interval=${interval}&limit=500`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw = await res.json() as [number, string, string, string, string, string, ...unknown[]][]
      setKlines(raw.map(parseKlineRow))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [symbol, interval, market])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (market === 'futures') {
      // fstream.binance.com is geo-blocked — poll latest candle via REST
      const poll = async () => {
        try {
          const res = await fetch(`${REST.futures}?symbol=${symbol}&interval=${interval}&limit=2`)
          if (!res.ok) return
          const raw = await res.json() as [number, string, string, string, string, string, ...unknown[]][]
          if (raw.length) setLiveCandle(parseKlineRow(raw[raw.length - 1]))
        } catch { /* skip */ }
      }
      void poll()
      const id = setInterval(() => void poll(), 2000)
      return () => clearInterval(id)
    }

    // Spot: WebSocket for real-time candle updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`)
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
    return () => { ws.onmessage = null; ws.close() }
  }, [symbol, interval, market])

  return { klines, liveCandle, loading, error }
}
