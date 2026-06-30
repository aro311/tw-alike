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

const HANDLE_RADIUS = 6

class PriceRangeRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing
  y1: number
  y2: number
  canvasWidth: number
  selected: boolean

  constructor(drawing: Drawing, y1: number, y2: number, canvasWidth: number, selected: boolean) {
    this.drawing = drawing
    this.y1 = y1
    this.y2 = y2
    this.canvasWidth = canvasWidth
    this.selected = selected
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { y1, y2, canvasWidth, drawing } = this
      const hRatio = scope.horizontalPixelRatio
      const vRatio = scope.verticalPixelRatio

      ctx.save()

      const topY = Math.min(y1, y2) * vRatio
      const bottomY = Math.max(y1, y2) * vRatio
      const height = bottomY - topY
      const width = canvasWidth * hRatio

      // Filled band at ~20% opacity
      const hex = drawing.color
      // Parse hex color to RGB for rgba usage
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`
      ctx.fillRect(0, topY, width, height)

      // Top border line
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(0, topY)
      ctx.lineTo(width, topY)
      ctx.stroke()

      // Bottom border line
      ctx.beginPath()
      ctx.moveTo(0, bottomY)
      ctx.lineTo(width, bottomY)
      ctx.stroke()

      // Control points when selected
      if (this.selected) {
        ctx.fillStyle = drawing.color
        ctx.strokeStyle = '#0f1117'
        ctx.lineWidth = 2

        // Top handle
        ctx.beginPath()
        ctx.arc((HANDLE_RADIUS + 4) * hRatio, topY, HANDLE_RADIUS * vRatio, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Bottom handle
        ctx.beginPath()
        ctx.arc((HANDLE_RADIUS + 4) * hRatio, bottomY, HANDLE_RADIUS * vRatio, 0, Math.PI * 2)
        ctx.fill()
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
    const price1 = this.drawing.points[0]?.value ?? 0
    const price2 = this.drawing.points[1]?.value ?? 0
    const y1 = this.series.priceToCoordinate(price1) ?? 0
    const y2 = this.series.priceToCoordinate(price2) ?? 0
    const width = this.chart.timeScale().width()
    return new PriceRangeRenderer(this.drawing, y1, y2, width, this.selected)
  }
}

export class PriceRangePrimitive implements ISeriesPrimitive<Time> {
  drawing: Drawing
  private _param: SeriesAttachedParameter<Time> | null = null
  private _selected: boolean = false
  private onSelect: (id: string) => void
  // onDelete reserved for future delete-icon support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  constructor(
    drawing: Drawing,
    onSelect: (id: string) => void,
    _onDelete: (id: string) => void,
  ) {
    this.drawing = drawing
    this.onSelect = onSelect
    void _onDelete // accepted for API symmetry with HorizontalRayPrimitive; delete UI not yet implemented
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

  hitTest(_x: number, y: number): PrimitiveHoveredItem | null {
    if (!this._param) return null
    const price1 = this.drawing.points[0]?.value ?? 0
    const price2 = this.drawing.points[1]?.value ?? 0
    const y1 = this._param.series.priceToCoordinate(price1) ?? -999
    const y2 = this._param.series.priceToCoordinate(price2) ?? -999
    const topY = Math.min(y1, y2)
    const bottomY = Math.max(y1, y2)
    const tolerance = Math.max(this.drawing.width, 4)

    // Hit top or bottom border
    if (Math.abs(y - topY) <= tolerance || Math.abs(y - bottomY) <= tolerance) {
      return { externalId: this.drawing.id, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
    }

    // Hit inside the band
    if (y >= topY && y <= bottomY) {
      return { externalId: this.drawing.id, cursorStyle: 'pointer', zOrder: 'normal', isBackground: true }
    }

    return null
  }

  onClick(param: { point?: { x: number; y: number } }) {
    if (!param.point) return
    const hit = this.hitTest(param.point.x, param.point.y)
    if (!hit) return
    this.onSelect(this.drawing.id)
  }

  paneViews(): IPrimitivePaneView[] {
    if (!this._param) return []
    return [new PriceRangePaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }
}
