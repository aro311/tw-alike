export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]

export const FIB_LEVEL_COLORS: Record<number, string> = {
  0: '#6b7280',
  0.236: '#ef4444',
  0.382: '#f59e0b',
  0.5: '#22c55e',
  0.618: '#06b6d4',
  0.786: '#3b82f6',
  1: '#6b7280',
}

export function getFibLevelPrice(points: { time: number; value: number }[], ratio: number): number {
  const p0 = points[0]?.value ?? 0
  const p1 = points[1]?.value ?? 0
  return p1 + ratio * (p0 - p1)
}

export function formatFibLabel(ratio: number, price: number): string {
  const ratioText = String(ratio)
  const priceText = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${ratioText} (${priceText})`
}

export function getFibBoxTimeRange(points: { time: number; value: number }[]): { start: number; end: number } {
  const t0 = points[0]?.time ?? 0
  const t1 = points[1]?.time ?? 0
  return { start: Math.min(t0, t1), end: Math.max(t0, t1) }
}

export function getTopmostAnchorIndex(points: { time: number; value: number }[]): 0 | 1 {
  const p0 = points[0]?.value ?? 0
  const p1 = points[1]?.value ?? 0
  return p0 >= p1 ? 0 : 1
}
