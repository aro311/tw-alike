import { RSI } from 'technicalindicators'

/**
 * Computes RSI for an array of closing prices.
 * Returns null for the first `period` entries (warm-up), then a number in [0, 100].
 */
export function computeRsi(closes: number[], period: number): (number | null)[] {
  const values = RSI.calculate({ period, values: closes })
  const nullPad: null[] = Array(closes.length - values.length).fill(null)
  return [...nullPad, ...values]
}
