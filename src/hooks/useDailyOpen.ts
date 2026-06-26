import { useEffect, useState } from 'react'

// Returns the open price of the current UTC-day (1d kline) for each symbol.
// UTC midnight = 7:00 AM Vietnam time — this gives the "today's change" baseline.
export function useDailyOpen(symbols: string[]): Record<string, number> {
  const [dailyOpens, setDailyOpens] = useState<Record<string, number>>({})
  const symbolsKey = symbols.join(',')

  useEffect(() => {
    const list = symbolsKey.split(',').filter(Boolean)
    if (!list.length) return

    const fetchOpens = async () => {
      const entries = await Promise.all(
        list.map(async (symbol) => {
          try {
            const res = await fetch(
              `https://api3.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=1`
            )
            const data = await (res.json() as Promise<[number, string, ...unknown[]][]>)
            return [symbol, parseFloat(data[0][1])] as const
          } catch {
            return null
          }
        })
      )
      const map: Record<string, number> = {}
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1]
      }
      setDailyOpens(map)
    }

    void fetchOpens()

    // Re-fetch when the UTC day rolls over
    const now = Date.now()
    const nextMidnight = (Math.floor(now / 86400000) + 1) * 86400000
    const timer = setTimeout(() => void fetchOpens(), nextMidnight - now)

    return () => clearTimeout(timer)
  }, [symbolsKey])

  return dailyOpens
}
