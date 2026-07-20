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
