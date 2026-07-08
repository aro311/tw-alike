import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  SeriesAttachedParameter,
  IPrimitivePaneRenderer,
  PrimitiveHoveredItem,
  Time,
  Logical,
  IChartApi,
} from 'lightweight-charts'

type DrawTarget = Parameters<IPrimitivePaneRenderer['draw']>[0]
import type { Drawing } from '@/types'

function timeToXExtrapolated(chart: IChartApi, time: number, fallback: number): number {
  const rawX = chart.timeScale().timeToCoordinate(time as Time)
  if (rawX !== null) return rawX

  const visRange = chart.timeScale().getVisibleRange()
  if (!visRange) return fallback
  const tFrom = visRange.from as number
  const tTo = visRange.to as number
  if (tFrom === tTo) return fallback

  const xFrom = chart.timeScale().timeToCoordinate(tFrom as Time)
  const xTo = chart.timeScale().timeToCoordinate(tTo as Time)
  if (xFrom === null || xTo === null) return fallback

  const lFrom = chart.timeScale().coordinateToLogical(xFrom) as unknown as number
  const lTo = chart.timeScale().coordinateToLogical(xTo) as unknown as number
  if (lFrom === null || lTo === null || lTo === lFrom) return fallback

  const anchorLogical = lTo + ((time - tTo) / (tTo - tFrom)) * (lTo - lFrom)
  return chart.timeScale().logicalToCoordinate(anchorLogical as unknown as Logical) ?? fallback
}

const HANDLE_RADIUS = 6
const DELETE_ICON_SIZE = 16

class PriceRangeRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing
  x1: number
  x2: number
  y1: number
  y2: number
  selected: boolean
  chartWidth: number

  constructor(drawing: Drawing, x1: number, x2: number, y1: number, y2: number, selected: boolean, chartWidth: number) {
    this.drawing = drawing
    this.x1 = x1
    this.x2 = x2
    this.y1 = y1
    this.y2 = y2
    this.selected = selected
    this.chartWidth = chartWidth
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { x1, x2, y1, y2, drawing } = this
      const hr = scope.horizontalPixelRatio
      const vr = scope.verticalPixelRatio

      ctx.save()

      const left = Math.min(x1, x2) * hr
      const right = Math.max(x1, x2) * hr
      const topY = Math.min(y1, y2) * vr
      const bottomY = Math.max(y1, y2) * vr
      const width = right - left
      const height = bottomY - topY

      if (width < 2 || height < 2) {
        ctx.restore()
        return
      }

      const hex = drawing.color
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)

      // Filled box
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`
      ctx.fillRect(left, topY, width, height)

      // Border lines
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(left, topY)
      ctx.lineTo(right, topY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(left, bottomY)
      ctx.lineTo(right, bottomY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(left, topY)
      ctx.lineTo(left, bottomY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(right, topY)
      ctx.lineTo(right, bottomY)
      ctx.stroke()

      // --- Full-height center arrow ---
      const p1val = drawing.points[0]?.value ?? 0
      const p2val = drawing.points[1]?.value ?? 0
      const goingUp = p2val > p1val
      const cx = (left + right) / 2
      const headH = Math.min(height * 0.2, 12 * vr)
      const headW = headH * 1.4
      const shaftW = Math.max(1.5 * hr, 1)
      const inset = 4 * vr  // gap from the border edge

      ctx.fillStyle = drawing.color
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = shaftW

      if (goingUp) {
        // Shaft from bottom up to just below arrowhead
        ctx.beginPath()
        ctx.moveTo(cx, bottomY - inset)
        ctx.lineTo(cx, topY + inset + headH)
        ctx.stroke()
        // Arrowhead at top
        ctx.beginPath()
        ctx.moveTo(cx, topY + inset)
        ctx.lineTo(cx - headW / 2, topY + inset + headH)
        ctx.lineTo(cx + headW / 2, topY + inset + headH)
        ctx.closePath()
        ctx.fill()
      } else {
        // Shaft from top down to just above arrowhead
        ctx.beginPath()
        ctx.moveTo(cx, topY + inset)
        ctx.lineTo(cx, bottomY - inset - headH)
        ctx.stroke()
        // Arrowhead at bottom
        ctx.beginPath()
        ctx.moveTo(cx, bottomY - inset)
        ctx.lineTo(cx - headW / 2, bottomY - inset - headH)
        ctx.lineTo(cx + headW / 2, bottomY - inset - headH)
        ctx.closePath()
        ctx.fill()
      }

      // --- Label pill at top center ---
      const priceDiff = Math.abs(p2val - p1val)
      const pct = p1val !== 0 ? Math.abs((p2val - p1val) / p1val) * 100 : 0
      const diffStr = priceDiff.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
      const pctStr = pct.toFixed(2) + '%'
      const labelText = `${diffStr}  (${pctStr})`

      const fontSize = 11 * vr
      ctx.font = `bold ${fontSize}px sans-serif`
      const textW = ctx.measureText(labelText).width
      const padX = 8 * hr
      const padY = 4 * vr
      const pillW = textW + padX * 2
      const pillH = fontSize + padY * 2
      const pillX = cx - pillW / 2
      const pillY = topY - pillH - 4 * vr

      // Pill background
      ctx.fillStyle = drawing.color
      ctx.beginPath()
      const pillR = pillH / 2
      ctx.roundRect(pillX, pillY, pillW, pillH, pillR)
      ctx.fill()

      // Pill text
      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(labelText, cx, pillY + pillH / 2)

      // Control handles at anchor positions
      if (this.selected) {
        ctx.fillStyle = drawing.color
        ctx.strokeStyle = '#0f1117'
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.arc(x1 * hr, y1 * vr, HANDLE_RADIUS * Math.min(hr, vr), 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x2 * hr, y2 * vr, HANDLE_RADIUS * Math.min(hr, vr), 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Delete icon — 10px outside the top-right corner of the box
        const MARGIN = 10
        const tY = Math.min(y1, y2)
        const rX = Math.max(x1, x2)
        const iconX = (rX + MARGIN - DELETE_ICON_SIZE / 2) * hr
        const iconY = (tY - MARGIN - DELETE_ICON_SIZE / 2) * vr
        const iw = DELETE_ICON_SIZE * hr
        const ih = DELETE_ICON_SIZE * vr
        const pad = 4

        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(iconX, iconY - ih / 2, iw, ih, 3)
        ctx.fill()

        ctx.strokeStyle = '#f87171'
        ctx.lineWidth = 1.5 * Math.min(hr, vr)
        ctx.beginPath()
        ctx.moveTo(iconX + pad * hr, iconY - ih / 2 + pad * vr)
        ctx.lineTo(iconX + iw - pad * hr, iconY + ih / 2 - pad * vr)
        ctx.moveTo(iconX + iw - pad * hr, iconY - ih / 2 + pad * vr)
        ctx.lineTo(iconX + pad * hr, iconY + ih / 2 - pad * vr)
        ctx.stroke()
      }

      ctx.restore()
    })
  }
}

class PriceRangePaneView implements IPrimitivePaneView {
  drawing: Drawing
  series: SeriesAttachedParameter<Time>['series']
  chart: SeriesAttachedParameter<Time>['chart']
  selected: boolean

  constructor(
    drawing: Drawing,
    series: SeriesAttachedParameter<Time>['series'],
    chart: SeriesAttachedParameter<Time>['chart'],
    selected: boolean,
  ) {
    this.drawing = drawing
    this.series = series
    this.chart = chart
    this.selected = selected
  }

  renderer(): IPrimitivePaneRenderer {
    const chartWidth = this.chart.timeScale().width()
    const p0 = this.drawing.points[0]
    const p1 = this.drawing.points[1]
    const x1 = timeToXExtrapolated(this.chart, p0?.time as number ?? 0, 0)
    const x2 = timeToXExtrapolated(this.chart, p1?.time as number ?? 0, chartWidth)
    const y1 = this.series.priceToCoordinate(p0?.value ?? 0) ?? 0
    const y2 = this.series.priceToCoordinate(p1?.value ?? 0) ?? 0
    return new PriceRangeRenderer(this.drawing, x1, x2, y1, y2, this.selected, chartWidth)
  }
}

export class PriceRangePrimitive implements ISeriesPrimitive<Time> {
  drawing: Drawing
  private _param: SeriesAttachedParameter<Time> | null = null
  private _selected: boolean = false
  private onSelect: (id: string) => void
  private onDelete: (id: string) => void

  constructor(
    drawing: Drawing,
    onSelect: (id: string) => void,
    onDelete: (id: string) => void,
  ) {
    this.drawing = drawing
    this.onSelect = onSelect
    this.onDelete = onDelete
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this._param = param
    param.requestUpdate()
  }

  detached() {
    this._param = null
  }

  setSelected(selected: boolean) {
    this._selected = selected
    this._param?.requestUpdate()
  }

  updateDrawing(drawing: Drawing) {
    this.drawing = drawing
    this._param?.requestUpdate()
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    if (!this._param) return null
    const { drawing, _param, _selected } = this
    const chartWidth = _param.chart.timeScale().width()
    const p0 = drawing.points[0]
    const p1 = drawing.points[1]
    const x1 = timeToXExtrapolated(_param.chart, p0?.time as number ?? 0, 0)
    const x2 = timeToXExtrapolated(_param.chart, p1?.time as number ?? 0, chartWidth)
    const y1 = _param.series.priceToCoordinate(p0?.value ?? 0) ?? -9999
    const y2 = _param.series.priceToCoordinate(p1?.value ?? 0) ?? -9999

    // Anchor handles and delete icon take priority when selected
    if (_selected) {
      const MARGIN = 10
      const topY = Math.min(y1, y2)
      const rightX = Math.max(x1, x2)
      const iconX = rightX + MARGIN - DELETE_ICON_SIZE / 2
      const iconY = topY - MARGIN - DELETE_ICON_SIZE / 2
      if (
        x >= iconX && x <= iconX + DELETE_ICON_SIZE &&
        y >= iconY - DELETE_ICON_SIZE / 2 && y <= iconY + DELETE_ICON_SIZE / 2
      ) {
        return { externalId: `delete:${drawing.id}`, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
      }
      if (Math.hypot(x - x1, y - y1) <= HANDLE_RADIUS + 4) {
        return { externalId: `anchor0:${drawing.id}`, cursorStyle: 'move', zOrder: 'top', isBackground: false }
      }
      if (Math.hypot(x - x2, y - y2) <= HANDLE_RADIUS + 4) {
        return { externalId: `anchor1:${drawing.id}`, cursorStyle: 'move', zOrder: 'top', isBackground: false }
      }
    }

    const boxLeft = Math.min(x1, x2)
    const boxRight = Math.max(x1, x2)
    const topY = Math.min(y1, y2)
    const bottomY = Math.max(y1, y2)

    if (x < boxLeft || x > boxRight) return null

    const tolerance = Math.max(drawing.width, 4)

    // Border edges
    if (
      Math.abs(y - topY) <= tolerance || Math.abs(y - bottomY) <= tolerance ||
      Math.abs(x - boxLeft) <= tolerance || Math.abs(x - boxRight) <= tolerance
    ) {
      return { externalId: drawing.id, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
    }

    // Interior
    if (y >= topY && y <= bottomY) {
      return { externalId: drawing.id, cursorStyle: 'pointer', zOrder: 'normal', isBackground: true }
    }

    return null
  }

  onClick(param: { point?: { x: number; y: number } }) {
    if (!param.point) return
    const hit = this.hitTest(param.point.x, param.point.y)
    if (!hit) return
    if (hit.externalId.startsWith('delete:')) {
      this.onDelete(this.drawing.id)
    } else {
      this.onSelect(this.drawing.id)
    }
  }

  paneViews(): IPrimitivePaneView[] {
    if (!this._param) return []
    return [new PriceRangePaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }
}
