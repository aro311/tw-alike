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
import { FIB_LEVELS, FIB_LEVEL_COLORS, getFibLevelPrice, getFibBoxTimeRange, formatFibLabel } from './fibonacciLevels'

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

const DELETE_ICON_SIZE = 16

const HANDLE_RADIUS = 6
const TREND_LINE_COLOR = '#9ca3af'
const ZONE_FILL_OPACITY = 0.15

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

class FibonacciRenderer implements IPrimitivePaneRenderer {
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

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { drawing, series, chart, selected } = this
      const hr = scope.horizontalPixelRatio
      const vr = scope.verticalPixelRatio
      const points = drawing.points

      const { start, end } = getFibBoxTimeRange(points)
      const chartWidth = chart.timeScale().width()
      const rawStartX = timeToXExtrapolated(chart, start as number, 0)
      const rawEndX = timeToXExtrapolated(chart, end as number, chartWidth)
      const startX = Math.max(0, Math.min(rawStartX, rawEndX)) * hr
      const endX = Math.min(chart.timeScale().width(), Math.max(rawStartX, rawEndX)) * hr
      if (startX >= endX) return

      ctx.save()

      // Zone fills between adjacent levels — colored by the level at the ratio-higher edge
      for (let i = 0; i < FIB_LEVELS.length - 1; i++) {
        const lowerRatio = FIB_LEVELS[i]
        const upperRatio = FIB_LEVELS[i + 1]
        const yLower = (series.priceToCoordinate(getFibLevelPrice(points, lowerRatio)) ?? 0) * vr
        const yUpper = (series.priceToCoordinate(getFibLevelPrice(points, upperRatio)) ?? 0) * vr
        ctx.fillStyle = hexToRgba(FIB_LEVEL_COLORS[upperRatio], ZONE_FILL_OPACITY)
        ctx.fillRect(startX, Math.min(yLower, yUpper), endX - startX, Math.abs(yUpper - yLower))
      }

      // Dashed trend line directly between the two anchors
      const anchorScreens = points.map((p) => ({
        x: timeToXExtrapolated(chart, p.time as number, chartWidth) * hr,
        y: (series.priceToCoordinate(p.value) ?? 0) * vr,
      }))
      ctx.strokeStyle = TREND_LINE_COLOR
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(anchorScreens[0].x, anchorScreens[0].y)
      ctx.lineTo(anchorScreens[1].x, anchorScreens[1].y)
      ctx.stroke()

      // Level lines + labels, bounded to the box
      for (const ratio of FIB_LEVELS) {
        const levelPrice = getFibLevelPrice(points, ratio)
        const y = (series.priceToCoordinate(levelPrice) ?? 0) * vr
        const color = FIB_LEVEL_COLORS[ratio]

        ctx.strokeStyle = color
        ctx.lineWidth = drawing.width
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.fillStyle = color
        ctx.font = `${11 * vr}px sans-serif`
        ctx.textBaseline = 'bottom'
        ctx.textAlign = 'right'
        ctx.fillText(formatFibLabel(ratio, levelPrice), startX - 4 * hr, y - 2 * vr)
        ctx.textAlign = 'left'
      }

      if (selected) {
        // Open-circle ControlPoints at both anchors
        for (const { x, y } of anchorScreens) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2 * hr
          ctx.beginPath()
          ctx.arc(x, y, HANDLE_RADIUS * vr, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Delete icon 10px outside the top-right corner of the drawing
        const MARGIN = 10
        const rightX = Math.max(...anchorScreens.map(a => a.x))
        const topY = Math.min(...anchorScreens.map(a => a.y))
        const iconX = rightX + MARGIN * hr - (DELETE_ICON_SIZE / 2) * hr
        const iconY = topY - MARGIN * vr - (DELETE_ICON_SIZE / 2) * vr
        const iw = DELETE_ICON_SIZE * hr
        const ih = DELETE_ICON_SIZE * vr

        ctx.fillStyle = '#374151'
        ctx.strokeStyle = '#6b7280'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(iconX, iconY - ih / 2, iw, ih, 3)
        ctx.fill()
        ctx.stroke()

        const pad = 4
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1.5
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

class FibonacciPaneView implements IPrimitivePaneView {
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
    return new FibonacciRenderer(this.drawing, this.series, this.chart, this.selected)
  }
}

export class FibonacciPrimitive implements ISeriesPrimitive<Time> {
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
    const points = drawing.points
    const tolerance = Math.max(drawing.width, 4)

    // ControlPoint anchors take priority over everything else (only when selected)
    if (_selected) {
      for (const [index, point] of points.entries()) {
        const anchorY = _param.series.priceToCoordinate(point.value) ?? -9999
        const anchorX = timeToXExtrapolated(_param.chart, point.time as number, _param.chart.timeScale().width())
        if (Math.hypot(x - anchorX, y - anchorY) <= HANDLE_RADIUS + 4) {
          return { externalId: `anchor${index}:${drawing.id}`, cursorStyle: 'move', zOrder: 'top', isBackground: false }
        }
      }
    }

    // Delete icon — 10px outside the top-right corner of the drawing
    if (_selected) {
      const MARGIN = 10
      const chartWidth = _param.chart.timeScale().width()
      const anchorXs = points.map(p => timeToXExtrapolated(_param.chart, p.time as number, chartWidth))
      const anchorYs = points.map(p => _param.series.priceToCoordinate(p.value) ?? 0)
      const rightX = Math.max(...anchorXs)
      const topY = Math.min(...anchorYs)
      const iconX = rightX + MARGIN - DELETE_ICON_SIZE / 2
      const iconY = topY - MARGIN - DELETE_ICON_SIZE / 2
      if (
        x >= iconX && x <= iconX + DELETE_ICON_SIZE &&
        y >= iconY - DELETE_ICON_SIZE / 2 && y <= iconY + DELETE_ICON_SIZE / 2
      ) {
        return { externalId: `delete:${drawing.id}`, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
      }
    }

    const { start, end } = getFibBoxTimeRange(points)
    const rawStartX = timeToXExtrapolated(_param.chart, start as number, 0)
    const rawEndX = timeToXExtrapolated(_param.chart, end as number, _param.chart.timeScale().width())
    const boxLeft = Math.min(rawStartX, rawEndX)
    const boxRight = Math.max(rawStartX, rawEndX)
    if (x < boxLeft || x > boxRight) return null

    // Proximity to any fib level line
    for (const ratio of FIB_LEVELS) {
      const levelPrice = getFibLevelPrice(points, ratio)
      const lineY = _param.series.priceToCoordinate(levelPrice) ?? -9999
      if (Math.abs(y - lineY) <= tolerance) {
        return { externalId: drawing.id, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
      }
    }

    // Anywhere else inside the bounded box selects the drawing too
    const priceAtZero = getFibLevelPrice(points, 0)
    const priceAtOne = getFibLevelPrice(points, 1)
    const yAtZero = _param.series.priceToCoordinate(priceAtZero) ?? -9999
    const yAtOne = _param.series.priceToCoordinate(priceAtOne) ?? -9999
    if (y >= Math.min(yAtZero, yAtOne) && y <= Math.max(yAtZero, yAtOne)) {
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
    return [new FibonacciPaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }
}
