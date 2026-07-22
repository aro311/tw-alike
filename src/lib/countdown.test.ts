import { describe, it, expect } from 'vitest'
import { INTERVAL_MS, computeRemainingMs, computeDisplayRemainingMs, formatCountdown } from './countdown'

describe('INTERVAL_MS', () => {
  it('maps representative intervals to correct millisecond durations', () => {
    expect(INTERVAL_MS['1m']).toBe(60_000)
    expect(INTERVAL_MS['5m']).toBe(5 * 60_000)
    expect(INTERVAL_MS['1h']).toBe(3_600_000)
    expect(INTERVAL_MS['4h']).toBe(4 * 3_600_000)
    expect(INTERVAL_MS['1d']).toBe(24 * 3_600_000)
    expect(INTERVAL_MS['1w']).toBe(7 * 24 * 3_600_000)
  })
})

describe('computeRemainingMs', () => {
  it('returns full interval duration right at candle open', () => {
    const openTimeSec = 1_000
    const nowMs = openTimeSec * 1000
    expect(computeRemainingMs(openTimeSec, '5m', nowMs)).toBe(INTERVAL_MS['5m'])
  })

  it('returns remaining ms partway through the interval', () => {
    const openTimeSec = 1_000
    const nowMs = openTimeSec * 1000 + 60_000
    expect(computeRemainingMs(openTimeSec, '5m', nowMs)).toBe(INTERVAL_MS['5m'] - 60_000)
  })

  it('clamps to 0 once the candle should have closed', () => {
    const openTimeSec = 1_000
    const nowMs = openTimeSec * 1000 + INTERVAL_MS['5m'] + 60_000
    expect(computeRemainingMs(openTimeSec, '5m', nowMs)).toBe(0)
  })
})

describe('computeDisplayRemainingMs', () => {
  it('3d: subtracts 1 DAY to match TradingView cycle offset', () => {
    // Binance remaining = 64h, TV remaining = 40h
    const DAY = 24 * 3_600_000
    const openSec = 1_000
    const nowMs = openSec * 1000 + 8 * 3_600_000   // 8h after open
    const raw = computeRemainingMs(openSec, '3d', nowMs)  // 3*DAY - 8h = 64h
    const display = computeDisplayRemainingMs(openSec, '3d', nowMs)
    expect(display).toBe(raw - DAY)                       // 40h
  })

  it('3d: clamps to 0 when Binance remaining < 1 DAY', () => {
    const openSec = 1_000
    const nowMs = openSec * 1000 + 2.5 * 24 * 3_600_000  // 2.5 days after open → 12h left on Binance
    expect(computeDisplayRemainingMs(openSec, '3d', nowMs)).toBe(0)
  })

  it('1M: uses actual days in opening month (July = 31 days)', () => {
    // July 1, 2026 00:00 UTC
    const openSec = Math.floor(Date.UTC(2026, 6, 1) / 1000)  // month 6 = July
    const nowMs = Date.UTC(2026, 6, 22, 8, 0, 0)             // July 22 08:00 UTC
    const display = computeDisplayRemainingMs(openSec, '1M', nowMs)
    const expected = Date.UTC(2026, 7, 1) - nowMs             // Aug 1 − now
    expect(display).toBe(expected)
  })

  it('1M: uses actual days in opening month (June = 30 days, matches 30*DAY)', () => {
    const openSec = Math.floor(Date.UTC(2026, 5, 1) / 1000)  // June 1
    const nowMs = Date.UTC(2026, 5, 15, 0, 0, 0)
    const display = computeDisplayRemainingMs(openSec, '1M', nowMs)
    const raw = computeRemainingMs(openSec, '1M', nowMs)
    expect(display).toBe(raw)  // June has 30 days, same as INTERVAL_MS['1M']
  })

  it('1w: no adjustment — same as computeRemainingMs', () => {
    const openSec = 1_000
    const nowMs = openSec * 1000 + 40 * 3_600_000
    expect(computeDisplayRemainingMs(openSec, '1w', nowMs)).toBe(computeRemainingMs(openSec, '1w', nowMs))
  })

  it('intra-day intervals: no adjustment', () => {
    const openSec = 1_000
    const nowMs = openSec * 1000 + 2 * 3_600_000
    expect(computeDisplayRemainingMs(openSec, '4h', nowMs)).toBe(computeRemainingMs(openSec, '4h', nowMs))
  })
})

describe('formatCountdown', () => {
  it('formats remaining time under 24h as hh:mm:ss', () => {
    expect(formatCountdown(3 * 3_600_000 + 59 * 60_000 + 7_000)).toBe('03:59:07')
    expect(formatCountdown(4 * 60_000 + 32_000)).toBe('00:04:32')
    expect(formatCountdown(0)).toBe('00:00:00')
  })

  it('formats remaining time of 24h or more as Xd hh:mm', () => {
    expect(formatCountdown(2 * 24 * 3_600_000 + 3 * 3_600_000 + 15 * 60_000)).toBe('2d 03:15')
    expect(formatCountdown(7 * 24 * 3_600_000)).toBe('7d 00:00')
  })

  it('treats exactly 24h as the day boundary', () => {
    expect(formatCountdown(24 * 3_600_000)).toBe('1d 00:00')
    expect(formatCountdown(24 * 3_600_000 - 1_000)).toBe('23:59:59')
  })
})
