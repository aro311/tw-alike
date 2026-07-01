import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  ISeriesPrimitiveAxisView,
  SeriesAttachedParameter,
  IPrimitivePaneRenderer,
  PrimitiveHoveredItem,
  Time,
} from 'lightweight-charts'

type DrawTarget = Parameters<IPrimitivePaneRenderer['draw']>[0]
import type { Drawing } from '@/types'

const HANDLE_RADIUS = 6
const DELETE_ICON_SIZE = 16
const DELETE_ICON_OFFSET = 20

class HorizontalRayRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing
  y: number
  anchorX: number
  canvasWidth: number
  selected: boolean

  constructor(drawing: Drawing, y: number, anchorX: number, canvasWidth: number, selected: boolean) {
    this.drawing = drawing
    this.y = y
    this.anchorX = anchorX
    this.canvasWidth = canvasWidth
    this.selected = selected
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { y, anchorX, canvasWidth, drawing, selected } = this
      const ratio = scope.verticalPixelRatio
      const hr = scope.horizontalPixelRatio

      // Clamp anchor to visible left edge; skip if anchor is off-screen right
      const startX = Math.max(0, anchorX)
      if (startX >= canvasWidth) return

      ctx.save()

      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(startX * hr, y * ratio)
      ctx.lineTo(canvasWidth * hr, y * ratio)
      ctx.stroke()

      if (selected) {
        const hy = y * ratio

        // Blue ring at anchor point (only when anchor is visible)
        if (anchorX >= 0) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2 * scope.horizontalPixelRatio
          ctx.beginPath()
          ctx.arc(startX * hr, hy, HANDLE_RADIUS * ratio, 0, Math.PI * 2)
          ctx.stroke()
        }

        const iconX = (canvasWidth - DELETE_ICON_SIZE - DELETE_ICON_OFFSET) * scope.horizontalPixelRatio
        const iconY = hy - DELETE_ICON_OFFSET * ratio
        const iw = DELETE_ICON_SIZE * scope.horizontalPixelRatio
        const ih = DELETE_ICON_SIZE * ratio
        ctx.fillStyle = '#374151'
        ctx.strokeStyle = '#6b7280'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(iconX, iconY - ih / 2, iw, ih, 3)
        ctx.fill()
        ctx.stroke()

        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 1.5
        const pad = 4
        ctx.beginPath()
        ctx.moveTo(iconX + pad, iconY - ih / 2 + pad)
        ctx.lineTo(iconX + iw - pad, iconY + ih / 2 - pad)
        ctx.moveTo(iconX + iw - pad, iconY - ih / 2 + pad)
        ctx.lineTo(iconX + pad, iconY + ih / 2 - pad)
        ctx.stroke()
      }

      ctx.restore()
    })
  }
}

class HorizontalRayPaneView implements IPrimitivePaneView {
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
    const price = this.drawing.points[0]?.value ?? 0
    const y = this.series.priceToCoordinate(price) ?? 0
    const anchorTime = this.drawing.points[0]?.time as Time | undefined
    const anchorX = anchorTime != null ? (this.chart.timeScale().timeToCoordinate(anchorTime) ?? 0) : 0
    const width = this.chart.timeScale().width()
    return new HorizontalRayRenderer(this.drawing, y, anchorX, width, this.selected)
  }
}

export class HorizontalRayPrimitive implements ISeriesPrimitive<Time> {
  drawing: Drawing
  private _param: SeriesAttachedParameter<Time> | null = null
  private _selected: boolean = false
  private onSelect: (id: string) => void
  private onDelete: (id: string) => void
  onDrag: (id: string, newPrice: number) => void

  constructor(
    drawing: Drawing,
    onSelect: (id: string) => void,
    onDelete: (id: string) => void,
    onDrag: (id: string, newPrice: number) => void,
  ) {
    this.drawing = drawing
    this.onSelect = onSelect
    this.onDelete = onDelete
    this.onDrag = onDrag
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
    const price = this.drawing.points[0]?.value ?? 0
    const lineY = this._param.series.priceToCoordinate(price) ?? -999
    const tolerance = Math.max(this.drawing.width, 4)
    const anchorTime = this.drawing.points[0]?.time as Time | undefined
    const anchorX = anchorTime != null ? (this._param.chart.timeScale().timeToCoordinate(anchorTime) ?? 0) : 0
    const visibleAnchorX = Math.max(0, anchorX)

    // Anchor ring takes priority — check it before the line body
    if (this._selected && anchorX >= 0 && Math.hypot(x - visibleAnchorX, y - lineY) <= HANDLE_RADIUS + 4) {
      return { externalId: `anchor:${this.drawing.id}`, cursorStyle: 'move', zOrder: 'top', isBackground: false }
    }

    if (x >= visibleAnchorX && Math.abs(y - lineY) <= tolerance) {
      return { externalId: this.drawing.id, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
    }

    if (this._selected) {
      const chartWidth = this._param.chart.timeScale().width()
      const iconX = chartWidth - DELETE_ICON_SIZE - DELETE_ICON_OFFSET
      const iconY = lineY - DELETE_ICON_OFFSET
      if (
        x >= iconX && x <= iconX + DELETE_ICON_SIZE &&
        y >= iconY - DELETE_ICON_SIZE / 2 && y <= iconY + DELETE_ICON_SIZE / 2
      ) {
        return { externalId: `delete:${this.drawing.id}`, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
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
    return [new HorizontalRayPaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }

  priceAxisViews(): readonly ISeriesPrimitiveAxisView[] {
    if (!this._param) return []
    const price = this.drawing.points[0]?.value ?? 0
    const coordinate = this._param.series.priceToCoordinate(price) ?? -1
    if (coordinate < 0) return []
    const label = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return [{
      coordinate: () => coordinate,
      text: () => label,
      textColor: () => '#ffffff',
      backColor: () => this.drawing.color,
    }]
  }
}
