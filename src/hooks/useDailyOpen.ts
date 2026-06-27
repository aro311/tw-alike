import { useEffect, useState } from 'react'
import type { WatchlistEntry } from '@/types'

const KLINES_URL: Record<string, string> = {
  spot: 'https://api3.binance.com/api/v3/klines',
  futures: 'https://fapi.binance.com/fapi/v1/klines',
}

// Returns the open price of the current UTC-day (1d kline) for each symbol.
// UTC midnight = 7:00 AM Vietnam time — this gives the "today's change" baseline.
export function useDailyOpen(entries: WatchlistEntry[]): Record<string, number> {
  const [dailyOpens, setDailyOpens] = useState<Record<string, number>>({})
  const key = entries.map((e) => `${e.symbol}:${e.market ?? 'spot'}`).join(',')

  useEffect(() => {
    const list = entries
    if (!list.length) return

    const fetchOpens = async () => {
      const results = await Promise.all(
        list.map(async (entry) => {
          const market = entry.market ?? 'spot'
          try {
            const res = await fetch(
              `${KLINES_URL[market]}?symbol=${entry.symbol}&interval=1d&limit=1`
            )
            const data = await (res.json() as Promise<[number, string, ...unknown[]][]>)
            return [entry.symbol, parseFloat(data[0][1])] as const
          } catch {
            return null
          }
        })
      )
      const map: Record<string, number> = {}
      for (const r of results) {
        if (r) map[r[0]] = r[1]
      }
      setDailyOpens(map)
    }

    void fetchOpens()

    const now = Date.now()
    const nextMidnight = (Math.floor(now / 86400000) + 1) * 86400000
    const timer = setTimeout(() => void fetchOpens(), nextMidnight - now)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return dailyOpens
}
