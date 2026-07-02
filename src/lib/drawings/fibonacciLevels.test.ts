import { describe, it, expect } from 'vitest'
import { getFibLevelPrice, formatFibLabel, getFibBoxTimeRange, getTopmostAnchorIndex, FIB_LEVELS, FIB_LEVEL_COLORS } from './fibonacciLevels'

describe('getFibLevelPrice', () => {
  it('ratio 1 resolves to points[0] (the mousedown anchor)', () => {
    const points = [{ time: 1, value: 112162.78 }, { time: 2, value: 98710.17 }]
    expect(getFibLevelPrice(points, 1)).toBe(112162.78)
  })

  it('ratio 0 resolves to points[1] (the mouseup anchor)', () => {
    const points = [{ time: 1, value: 112162.78 }, { time: 2, value: 98710.17 }]
    expect(getFibLevelPrice(points, 0)).toBe(98710.17)
  })

  it('interpolates the same way whether the mousedown point is higher or lower', () => {
    const draggedDown = [{ time: 1, value: 112162.78 }, { time: 2, value: 98710.17 }]
    const draggedUp = [{ time: 1, value: 98575.97 }, { time: 2, value: 112162.78 }]

    // 0.5 is always the midpoint between the two anchors, regardless of drag direction
    expect(getFibLevelPrice(draggedDown, 0.5)).toBeCloseTo((112162.78 + 98710.17) / 2)
    expect(getFibLevelPrice(draggedUp, 0.5)).toBeCloseTo((98575.97 + 112162.78) / 2)
  })
})

describe('formatFibLabel', () => {
  it('formats a ratio and price as "ratio (comma-grouped price)"', () => {
    expect(formatFibLabel(0.618, 135592.45)).toBe('0.618 (135,592.45)')
  })

  it('renders whole-number ratios in their shortest form, not padded decimals', () => {
    expect(formatFibLabel(0.5, 105436.48)).toBe('0.5 (105,436.48)')
    expect(formatFibLabel(0, 98710.17)).toBe('0 (98,710.17)')
    expect(formatFibLabel(1, 112162.78)).toBe('1 (112,162.78)')
  })
})

describe('getFibBoxTimeRange', () => {
  it('returns start/end regardless of which anchor was placed first', () => {
    const draggedForward = [{ time: 100, value: 1 }, { time: 500, value: 2 }]
    const draggedBackward = [{ time: 500, value: 1 }, { time: 100, value: 2 }]

    expect(getFibBoxTimeRange(draggedForward)).toEqual({ start: 100, end: 500 })
    expect(getFibBoxTimeRange(draggedBackward)).toEqual({ start: 100, end: 500 })
  })
})

describe('getTopmostAnchorIndex', () => {
  it('returns the index of whichever point has the higher price', () => {
    expect(getTopmostAnchorIndex([{ time: 1, value: 112162.78 }, { time: 2, value: 98710.17 }])).toBe(0)
    expect(getTopmostAnchorIndex([{ time: 1, value: 98575.97 }, { time: 2, value: 112162.78 }])).toBe(1)
  })
})

describe('FIB_LEVELS / FIB_LEVEL_COLORS', () => {
  it('exposes exactly the 7 spec levels with their fixed colors, no extensions', () => {
    expect(FIB_LEVELS).toEqual([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1])
    expect(FIB_LEVEL_COLORS).toEqual({
      0: '#6b7280',
      0.236: '#ef4444',
      0.382: '#f59e0b',
      0.5: '#22c55e',
      0.618: '#06b6d4',
      0.786: '#3b82f6',
      1: '#6b7280',
    })
  })
})
