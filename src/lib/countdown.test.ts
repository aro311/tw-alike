import { describe, it, expect } from 'vitest'
import { INTERVAL_MS, computeRemainingMs, formatCountdown } from './countdown'

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
