import type { Interval } from '@/types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const INTERVAL_MS: Record<Interval, number> = {
  '1m': MINUTE,
  '3m': 3 * MINUTE,
  '5m': 5 * MINUTE,
  '15m': 15 * MINUTE,
  '30m': 30 * MINUTE,
  '1h': HOUR,
  '2h': 2 * HOUR,
  '4h': 4 * HOUR,
  '6h': 6 * HOUR,
  '8h': 8 * HOUR,
  '12h': 12 * HOUR,
  '1d': DAY,
  '3d': 3 * DAY,
  '1w': 7 * DAY,
  '1M': 30 * DAY,
}

export function computeRemainingMs(openTimeSec: number, interval: Interval, nowMs: number): number {
  const closeMs = openTimeSec * 1000 + INTERVAL_MS[interval]
  return Math.max(0, closeMs - nowMs)
}

// Returns the remaining ms adjusted per TradingView's display conventions:
// - 3d: TradingView's cycle starts 1 day before Binance's epoch, so subtract 1 DAY.
// - 1M: use the actual days in the opening month, not the fixed 30-day approximation.
// - everything else: identical to computeRemainingMs.
export function computeDisplayRemainingMs(openTimeSec: number, interval: Interval, nowMs: number): number {
  const openMs = openTimeSec * 1000
  if (interval === '1M') {
    const d = new Date(openMs)
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    return Math.max(0, openMs + daysInMonth * DAY - nowMs)
  }
  const remaining = computeRemainingMs(openTimeSec, interval, nowMs)
  if (interval === '3d') {
    return Math.max(0, remaining - DAY)
  }
  return remaining
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.floor(remainingMs / 1000)
  if (remainingMs >= DAY) {
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${days}d ${pad(hours)}:${pad(minutes)}`
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
