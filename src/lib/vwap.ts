import type { Kline } from '@/types'
import type { VwapAnchor } from '@/types'

function getSessionKey(time: number, anchor: VwapAnchor): number {
  const d = new Date(time * 1000)
  switch (anchor) {
    case 'D':   return Math.floor(time / 86400)
    case 'W':   return Math.floor((time + 3 * 86400) / (7 * 86400)) // Monday-aligned
    case 'M':   return d.getUTCFullYear() * 12 + d.getUTCMonth()
    case '12M': return d.getUTCFullYear()
  }
}

export function computeVwap(klines: Kline[], anchor: VwapAnchor): (number | null)[] {
  const result: (number | null)[] = []
  let vwapsum = 0
  let volumesum = 0
  let prevKey = -Infinity

  for (const k of klines) {
    const key = getSessionKey(k.time, anchor)
    if (key !== prevKey) {
      vwapsum = 0
      volumesum = 0
      prevKey = key
    }
    const hl2 = (k.high + k.low) / 2
    vwapsum += hl2 * k.volume
    volumesum += k.volume
    result.push(volumesum === 0 ? null : vwapsum / volumesum)
  }

  return result
}

export function computeVwapLive(
  klines: Kline[],
  liveCandle: Kline,
  anchor: VwapAnchor,
): number | null {
  const sessionKey = getSessionKey(liveCandle.time, anchor)

  // Find where the current session starts in klines
  let i = klines.length - 1
  while (i > 0 && getSessionKey(klines[i - 1].time, anchor) === sessionKey) {
    i--
  }

  let vwapsum = 0
  let volumesum = 0
  for (let j = i; j < klines.length; j++) {
    const hl2 = (klines[j].high + klines[j].low) / 2
    vwapsum += hl2 * klines[j].volume
    volumesum += klines[j].volume
  }
  const hl2 = (liveCandle.high + liveCandle.low) / 2
  vwapsum += hl2 * liveCandle.volume
  volumesum += liveCandle.volume

  return volumesum === 0 ? null : vwapsum / volumesum
}
