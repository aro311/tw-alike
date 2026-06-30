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
const DELETE_ICON_SIZE = 16
const DELETE_ICON_OFFSET = 20

class HorizontalRayRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing
  y: number
  canvasWidth: number
  selected: boolean

  constructor(drawing: Drawing, y: number, canvasWidth: number, selected: boolean) {
    this.drawing = drawing
    this.y = y
    this.canvasWidth = canvasWidth
    this.selected = selected
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { y, canvasWidth, drawing, selected } = this
      const ratio = scope.verticalPixelRatio

      ctx.save()

      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(0, y * ratio)
      ctx.lineTo(canvasWidth * scope.horizontalPixelRatio, y * ratio)
      ctx.stroke()

      if (selected) {
        const hy = y * ratio
        ctx.fillStyle = drawing.color
        ctx.strokeStyle = '#0f1117'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc((HANDLE_RADIUS + 4) * scope.horizontalPixelRatio, hy, HANDLE_RADIUS * ratio, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

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
    const width = this.chart.timeScale().width()
    return new HorizontalRayRenderer(this.drawing, y, width, this.selected)
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

    if (Math.abs(y - lineY) <= tolerance) {
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
}
