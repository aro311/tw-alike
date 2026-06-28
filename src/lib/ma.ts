import { EMA, WMA } from 'technicalindicators'

function padNull<T>(values: T[], targetLength: number): (T | null)[] {
  const nullPad: null[] = Array(targetLength - values.length).fill(null)
  return [...nullPad, ...values]
}

export function computeEma(closes: number[], period: number): (number | null)[] {
  return padNull(EMA.calculate({ period, values: closes }), closes.length)
}

export function computeWma(closes: number[], period: number): (number | null)[] {
  return padNull(WMA.calculate({ period, values: closes }), closes.length)
}
