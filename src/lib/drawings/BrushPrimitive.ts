import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  SeriesAttachedParameter,
  IPrimitivePaneRenderer,
  PrimitiveHoveredItem,
  Time,
} from 'lightweight-charts'

type DrawTarget = Parameters<IPrimitivePaneRenderer['draw']>[0]
import type { Drawing } from '@/types'

const HIT_TOLERANCE = 8 // pixels
const DELETE_ICON_SIZE = 16
const DELETE_MARGIN = 10

function screenBoundingBox(
  drawing: Drawing,
  series: SeriesAttachedParameter<Time>['series'],
  chart: SeriesAttachedParameter<Time>['chart'],
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const pt of drawing.points) {
    const x = chart.timeScale().timeToCoordinate(pt.time as Time)
    const y = series.priceToCoordinate(pt.value)
    if (x === null || y === null) continue
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
  return { minX, minY, maxX, maxY }
}

class BrushRenderer implements IPrimitivePaneRenderer {
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
      const points = drawing.points

      if (points.length < 2) return

      ctx.save()
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width * scope.verticalPixelRatio
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.setLineDash([])

      ctx.beginPath()
      let started = false
      for (const pt of points) {
        const x = chart.timeScale().timeToCoordinate(pt.time as Time)
        const y = series.priceToCoordinate(pt.value)
        if (x === null || y === null) continue
        const bx = x * scope.horizontalPixelRatio
        const by = y * scope.verticalPixelRatio
        if (!started) {
          ctx.moveTo(bx, by)
          started = true
        } else {
          ctx.lineTo(bx, by)
        }
      }
      ctx.stroke()

      if (selected) {
        const bbox = screenBoundingBox(drawing, series, chart)
        if (bbox) {
          const hr = scope.horizontalPixelRatio
          const vr = scope.verticalPixelRatio
          const iconX = (bbox.maxX + DELETE_MARGIN - DELETE_ICON_SIZE / 2) * hr
          const iconY = (bbox.minY - DELETE_MARGIN - DELETE_ICON_SIZE / 2) * vr
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
      }

      ctx.restore()
    })
  }
}

class BrushPaneView implements IPrimitivePaneView {
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
    return new BrushRenderer(this.drawing, this.series, this.chart, this.selected)
  }
}

export class BrushPrimitive implements ISeriesPrimitive<Time> {
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

    if (_selected) {
      const bbox = screenBoundingBox(drawing, _param.series, _param.chart)
      if (bbox) {
        const iconX = bbox.maxX + DELETE_MARGIN - DELETE_ICON_SIZE / 2
        const iconY = bbox.minY - DELETE_MARGIN - DELETE_ICON_SIZE / 2
        if (
          x >= iconX && x <= iconX + DELETE_ICON_SIZE &&
          y >= iconY - DELETE_ICON_SIZE / 2 && y <= iconY + DELETE_ICON_SIZE / 2
        ) {
          return { externalId: `delete:${drawing.id}`, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
        }
      }
    }

    for (let i = 0; i < points.length - 1; i++) {
      const ax = _param.chart.timeScale().timeToCoordinate(points[i].time as Time)
      const ay = _param.series.priceToCoordinate(points[i].value)
      const bx = _param.chart.timeScale().timeToCoordinate(points[i + 1].time as Time)
      const by = _param.series.priceToCoordinate(points[i + 1].value)
      if (ax === null || ay === null || bx === null || by === null) continue

      const dist = pointToSegmentDistance(x, y, ax, ay, bx, by)
      if (dist <= HIT_TOLERANCE) {
        return { externalId: drawing.id, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
      }
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
    return [new BrushPaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }
}

function pointToSegmentDistance(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay)
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}
