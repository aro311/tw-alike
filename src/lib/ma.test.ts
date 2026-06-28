import { describe, it, expect } from 'vitest'
import { computeEma, computeWma } from './ma'

// Minimal close sequence: enough to produce at least one value for period 3
const CLOSES = [10, 11, 12, 13, 14, 15]

describe('computeEma', () => {
  it('output length equals input length', () => {
    expect(computeEma(CLOSES, 3)).toHaveLength(CLOSES.length)
  })

  it('returns null for the first (period - 1) entries', () => {
    const result = computeEma(CLOSES, 3)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeNull()
    expect(result[2]).not.toBeNull()
  })

  it('all non-null values are numbers', () => {
    const result = computeEma(CLOSES, 3)
    for (const v of result) {
      if (v !== null) expect(typeof v).toBe('number')
    }
  })

  it('EMA(3) at index 2 equals the SMA of first 3 closes (seed value)', () => {
    // First EMA value seeds from SMA: (10+11+12)/3 = 11
    const result = computeEma(CLOSES, 3)
    expect(result[2]).toBeCloseTo(11, 5)
  })
})

describe('computeWma', () => {
  it('output length equals input length', () => {
    expect(computeWma(CLOSES, 3)).toHaveLength(CLOSES.length)
  })

  it('returns null for the first (period - 1) entries', () => {
    const result = computeWma(CLOSES, 3)
    expect(result[0]).toBeNull()
    expect(result[1]).toBeNull()
    expect(result[2]).not.toBeNull()
  })

  it('all non-null values are numbers', () => {
    const result = computeWma(CLOSES, 3)
    for (const v of result) {
      if (v !== null) expect(typeof v).toBe('number')
    }
  })

  it('WMA(3) at index 2: weights 1,2,3 → (10*1 + 11*2 + 12*3)/6 = 11.33', () => {
    const result = computeWma(CLOSES, 3)
    expect(result[2]).toBeCloseTo(11.333, 2)
  })
})
