import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  SeriesAttachedParameter,
  IPrimitivePaneRenderer,
  Time,
} from 'lightweight-charts'

type DrawTarget = Parameters<IPrimitivePaneRenderer['draw']>[0]
import type { Drawing } from '@/types'

class DateRangeRenderer implements IPrimitivePaneRenderer {
  drawing: Drawing

  constructor(drawing: Drawing) {
    this.drawing = drawing
  }

  draw(target: DrawTarget) {
    target.useBitmapCoordinateSpace((scope: Parameters<DrawTarget['useBitmapCoordinateSpace']>[0] extends (s: infer S) => void ? S : never) => {
      const ctx = scope.context
      const { drawing } = this

      // The chart reference is stored outside — we use the values computed in the pane view
      // This renderer receives pre-computed x1/x2 coordinates
      const x1 = (this as unknown as { _x1: number })._x1 ?? 0
      const x2 = (this as unknown as { _x2: number })._x2 ?? 0
      const h = scope.mediaSize.height

      const minX = Math.min(x1, x2) * scope.horizontalPixelRatio
      const maxX = Math.max(x1, x2) * scope.horizontalPixelRatio
      const width = maxX - minX
      const height = h * scope.verticalPixelRatio

      ctx.save()

      // Filled band with ~20% opacity
      const hex = drawing.color
      ctx.fillStyle = hex + '33' // ~20% opacity appended as hex
      ctx.fillRect(minX, 0, width, height)

      // Left border line
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(minX, 0)
      ctx.lineTo(minX, height)
      ctx.stroke()

      // Right border line
      ctx.beginPath()
      ctx.moveTo(maxX, 0)
      ctx.lineTo(maxX, height)
      ctx.stroke()

      // Control point circles at top of each border line
      const cpRadius = 5
      ctx.fillStyle = drawing.color
      ctx.beginPath()
      ctx.arc(minX, cpRadius * scope.verticalPixelRatio, cpRadius * scope.horizontalPixelRatio, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(maxX, cpRadius * scope.verticalPixelRatio, cpRadius * scope.horizontalPixelRatio, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })
  }
}

// Extended renderer that carries pre-computed x coordinates
class DateRangeRendererWithCoords extends DateRangeRenderer {
  _x1: number
  _x2: number

  constructor(drawing: Drawing, x1: number, x2: number) {
    super(drawing)
    this._x1 = x1
    this._x2 = x2
  }
}

class DateRangePaneView implements IPrimitivePaneView {
  drawing: Drawing
  chart: SeriesAttachedParameter<Time>['chart']

  constructor(
    drawing: Drawing,
    chart: SeriesAttachedParameter<Time>['chart'],
  ) {
    this.drawing = drawing
    this.chart = chart
  }

  renderer(): IPrimitivePaneRenderer {
    const t1 = this.drawing.points[0]?.time ?? 0
    const t2 = this.drawing.points[1]?.time ?? 0
    const x1 = this.chart.timeScale().timeToCoordinate(t1 as Time) ?? 0
    const x2 = this.chart.timeScale().timeToCoordinate(t2 as Time) ?? 0
    return new DateRangeRendererWithCoords(this.drawing, x1, x2)
  }
}

export class DateRangePrimitive implements ISeriesPrimitive<Time> {
  drawing: Drawing
  private _param: SeriesAttachedParameter<Time> | null = null

  constructor(drawing: Drawing) {
    this.drawing = drawing
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

  paneViews(): IPrimitivePaneView[] {
    if (!this._param) return []
    return [new DateRangePaneView(this.drawing, this._param.chart)]
  }
}
