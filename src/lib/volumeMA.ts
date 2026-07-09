export function computeVolumeSMA(klines: { volume: number }[], period = 20): (number | null)[] {
  return klines.map((_, i) => {
    if (i < period - 1) return null
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += klines[j].volume
    return sum / period
  })
}
