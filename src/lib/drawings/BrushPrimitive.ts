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

class BrushRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing
  series: SeriesAttachedParameter<Time>['series']
  chart: SeriesAttachedParameter<Time>['chart']

  constructor(
    drawing: Drawing,
    series: SeriesAttachedParameter<Time>['series'],
    chart: SeriesAttachedParameter<Time>['chart'],
  ) {
    this.drawing = drawing
    this.series = series
    this.chart = chart
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { drawing, series, chart } = this
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
      ctx.restore()
    })
  }
}

class BrushPaneView implements IPrimitivePaneView {
  drawing: Drawing
  series: SeriesAttachedParameter<Time>['series']
  chart: SeriesAttachedParameter<Time>['chart']

  constructor(
    drawing: Drawing,
    series: SeriesAttachedParameter<Time>['series'],
    chart: SeriesAttachedParameter<Time>['chart'],
  ) {
    this.drawing = drawing
    this.series = series
    this.chart = chart
  }

  renderer(): IPrimitivePaneRenderer {
    return new BrushRenderer(this.drawing, this.series, this.chart)
  }
}

export class BrushPrimitive implements ISeriesPrimitive<Time> {
  drawing: Drawing
  private _param: SeriesAttachedParameter<Time> | null = null
  private onSelect: (id: string) => void

  constructor(
    drawing: Drawing,
    onSelect: (id: string) => void,
  ) {
    this.drawing = drawing
    this.onSelect = onSelect
  }

  attached(param: SeriesAttachedParameter<Time>) {
    this._param = param
    param.requestUpdate()
  }

  detached() {
    this._param = null
  }

  updateDrawing(drawing: Drawing) {
    this.drawing = drawing
    this._param?.requestUpdate()
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    if (!this._param) return null
    const { drawing, _param } = this
    const points = drawing.points

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
    if (hit) {
      this.onSelect(this.drawing.id)
    }
  }

  paneViews(): IPrimitivePaneView[] {
    if (!this._param) return []
    return [new BrushPaneView(this.drawing, this._param.series, this._param.chart)]
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
