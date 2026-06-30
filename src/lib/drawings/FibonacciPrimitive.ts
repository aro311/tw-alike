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

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
const DELETE_ICON_SIZE = 16
const DELETE_ICON_OFFSET = 20

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

      const high = drawing.points[0]?.value ?? 0
      const low = drawing.points[1]?.value ?? 0
      const canvasWidth = chart.timeScale().width() * hr

      ctx.save()

      for (const ratio of FIB_LEVELS) {
        const levelPrice = high - ratio * (high - low)
        const y = (series.priceToCoordinate(levelPrice) ?? 0) * vr

        ctx.strokeStyle = drawing.color
        ctx.lineWidth = drawing.width
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvasWidth, y)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.fillStyle = drawing.color
        ctx.font = `${11 * vr}px sans-serif`
        ctx.textBaseline = 'bottom'
        const label = `${ratio.toFixed(3)}  ${levelPrice.toFixed(2)}`
        ctx.fillText(label, 4 * hr, y - 2 * vr)
      }

      if (selected) {
        // Delete icon near top-right, anchored to the 0% (high) level line
        const topY = (series.priceToCoordinate(high) ?? 0) * vr
        const iconX = (chart.timeScale().width() - DELETE_ICON_SIZE - DELETE_ICON_OFFSET) * hr
        const iconY = topY - DELETE_ICON_OFFSET * vr
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
    const high = drawing.points[0]?.value ?? 0
    const low = drawing.points[1]?.value ?? 0
    const tolerance = Math.max(drawing.width, 4)

    // Check delete icon hit first (only when selected)
    if (_selected) {
      const chartWidth = _param.chart.timeScale().width()
      const topY = _param.series.priceToCoordinate(high) ?? 0
      const iconX = chartWidth - DELETE_ICON_SIZE - DELETE_ICON_OFFSET
      const iconY = topY - DELETE_ICON_OFFSET
      if (
        x >= iconX && x <= iconX + DELETE_ICON_SIZE &&
        y >= iconY - DELETE_ICON_SIZE / 2 && y <= iconY + DELETE_ICON_SIZE / 2
      ) {
        return { externalId: `delete:${drawing.id}`, cursorStyle: 'pointer', zOrder: 'top', isBackground: false }
      }
    }

    // Check proximity to any fib level line
    for (const ratio of FIB_LEVELS) {
      const levelPrice = high - ratio * (high - low)
      const lineY = _param.series.priceToCoordinate(levelPrice) ?? -9999
      if (Math.abs(y - lineY) <= tolerance) {
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
    return [new FibonacciPaneView(this.drawing, this._param.series, this._param.chart, this._selected)]
  }
}
