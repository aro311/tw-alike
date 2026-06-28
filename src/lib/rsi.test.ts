import { describe, it, expect } from 'vitest'
import { computeRsi } from './rsi'

// Hand-verified RSI(3) on a tiny sequence so the test is self-documenting.
// RSI(3) needs 3 periods of average gain/loss.
// closes: [10, 11, 12, 11, 13]
//   changes:       +1  +1  -1  +2
//   first avg gain (period 3): (1+1+0)/3 = 0.667  avg loss: (0+0+1)/3 = 0.333
//   RS = 0.667/0.333 = 2.0  →  RSI = 100 - 100/3 = 66.67
//   next avg gain: (0.667*2 + 2)/3 = 1.111  avg loss: (0.333*2 + 0)/3 = 0.222
//   RS = 1.111/0.222 = 5.0  →  RSI = 100 - 100/6 = 83.33

const CLOSES = [10, 11, 12, 11, 13]

describe('computeRsi', () => {
  it('returns null for the first (period) entries where RSI is undefined', () => {
    const result = computeRsi(CLOSES, 3)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeNull()
    expect(result[2]).toBeNull()
  })

  it('returns a number for entries after the warm-up period', () => {
    const result = computeRsi(CLOSES, 3)
    expect(typeof result[3]).toBe('number')
    expect(typeof result[4]).toBe('number')
  })

  it('output length equals input length', () => {
    const result = computeRsi(CLOSES, 3)
    expect(result).toHaveLength(CLOSES.length)
  })

  it('RSI is bounded between 0 and 100', () => {
    const result = computeRsi(CLOSES, 3)
    for (const v of result) {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
    }
  })

  it('RSI(3) at index 3 is approximately 66.67', () => {
    const result = computeRsi(CLOSES, 3)
    expect(result[3]).toBeCloseTo(66.67, 1)
  })

  it('RSI(3) at index 4 is approximately 83.33', () => {
    const result = computeRsi(CLOSES, 3)
    expect(result[4]).toBeCloseTo(83.33, 1)
  })
})
