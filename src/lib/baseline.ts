import type { Kline } from '@/types'

const FAST_LENGTH = 70
const FAST_PHASE = 5
const FAST_POWER = 2
const SLOW_LENGTH = 200
const SLOW_PHASE = 0
const SLOW_POWER = 2

function jmaStep(
  src: number,
  prevE0: number,
  prevE1: number,
  prevE2: number,
  prevJma: number,
  alpha: number,
  beta: number,
  phaseRatio: number,
): [number, number, number, number] {
  const e0 = (1 - alpha) * src + alpha * prevE0
  const e1 = (src - e0) * (1 - beta) + beta * prevE1
  const e2 = (e0 + phaseRatio * e1 - prevJma) * Math.pow(1 - alpha, 2) + Math.pow(alpha, 2) * prevE2
  const jma = e2 + prevJma
  return [e0, e1, e2, jma]
}

function jmaParams(length: number, power: number, phase: number) {
  const phaseRatio = phase < -100 ? 0.5 : phase > 100 ? 2.5 : phase / 100 + 1.5
  const beta = (0.45 * (length - 1)) / (0.45 * (length - 1) + 2)
  const alpha = Math.pow(beta, power)
  return { alpha, beta, phaseRatio }
}

function computeJma(values: number[], length: number, power: number, phase: number): number[] {
  const { alpha, beta, phaseRatio } = jmaParams(length, power, phase)
  const result: number[] = []
  let e0 = 0, e1 = 0, e2 = 0, jma = 0

  for (const src of values) {
    ;[e0, e1, e2, jma] = jmaStep(src, e0, e1, e2, jma, alpha, beta, phaseRatio)
    result.push(jma)
  }

  return result
}

export function computeBaseline(klines: Kline[]): { fast: number[]; slow: number[] } {
  const closes = klines.map((k) => k.close)
  return {
    fast: computeJma(closes, FAST_LENGTH, FAST_POWER, FAST_PHASE),
    slow: computeJma(closes, SLOW_LENGTH, SLOW_POWER, SLOW_PHASE),
  }
}

export function computeBaselineLive(
  klines: Kline[],
  liveCandle: Kline,
): { fast: number; slow: number } {
  const closes = [...klines.map((k) => k.close), liveCandle.close]
  const fast = computeJma(closes, FAST_LENGTH, FAST_POWER, FAST_PHASE)
  const slow = computeJma(closes, SLOW_LENGTH, SLOW_POWER, SLOW_PHASE)
  return {
    fast: fast[fast.length - 1],
    slow: slow[slow.length - 1],
  }
}
