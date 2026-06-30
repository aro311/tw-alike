import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import type { Kline, VwapAnchor } from '@/types'
import { computeVwap, computeVwapLive } from '@/lib/vwap'
import { computeBaseline, computeBaselineLive } from '@/lib/baseline'
import { DrawingToolbar } from './DrawingToolbar'
import { useAppStore } from '@/store'
import { HorizontalRayPrimitive } from '@/lib/drawings/HorizontalRayPrimitive'
import { PriceRangePrimitive } from '@/lib/drawings/PriceRangePrimitive'
import { FibonacciPrimitive } from '@/lib/drawings/FibonacciPrimitive'
import { DateRangePrimitive } from '@/lib/drawings/DateRangePrimitive'
import { BrushPrimitive } from '@/lib/drawings/BrushPrimitive'
import type { Drawing } from '@/types'

const EMPTY_DRAWINGS: Drawing[] = []

interface Props {
  klines: Kline[]
  liveCandle: Kline | null
  loading: boolean
  onChartReady?: (chart: IChartApi) => void
  vwapEnabled: boolean
  vwapAnchor: VwapAnchor
  blEnabled: boolean
  blSlowEnabled: boolean
}

export function ChartPanel({ klines, liveCandle, loading, onChartReady, vwapEnabled, vwapAnchor, blEnabled, blSlowEnabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null)
  const vwapRef = useRef<ISeriesApi<'Line', Time> | null>(null)
  const blRef = useRef<ISeriesApi<'Line', Time> | null>(null)
  const blSlowRef = useRef<ISeriesApi<'Line', Time> | null>(null)

  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const activeColor = useAppStore((s) => s.activeColor)
  const activeWidth = useAppStore((s) => s.activeWidth)
  const activeSymbol = useAppStore((s) => s.activeSymbol)
  const selectedDrawingId = useAppStore((s) => s.selectedDrawingId)
  const setSelectedDrawingId = useAppStore((s) => s.setSelectedDrawingId)
  const addDrawing = useAppStore((s) => s.addDrawing)
  const removeDrawing = useAppStore((s) => s.removeDrawing)
  const updateDrawing = useAppStore((s) => s.updateDrawing)
  const undoLastDrawing = useAppStore((s) => s.undoLastDrawing)
  // Read drawings directly from symbolSettings to avoid creating a new object on every render
  const drawings = useAppStore((s) => s.symbolSettings[s.activeSymbol]?.drawings ?? EMPTY_DRAWINGS)

  // Map of drawing id → primitive instance (HorizontalRayPrimitive or PriceRangePrimitive)
  const primitivesRef = useRef<Map<string, HorizontalRayPrimitive | PriceRangePrimitive>>(new Map())
  const fibPrimitivesRef = useRef<Map<string, FibonacciPrimitive>>(new Map())
  const dateRangePrimitivesRef = useRef<Map<string, DateRangePrimitive>>(new Map())
  const brushPrimitivesRef = useRef<Map<string, BrushPrimitive>>(new Map())
  // Track drag state for ControlPoint repositioning (existing drawings)
  const dragRef = useRef<{ id: string; startY: number; startPrice: number } | null>(null)
  // Unified drag state for drawing placement — stores start pixel + initial price/time for preview updates
  const drawDragRef = useRef<{ startX: number; startY: number; p1Price: number; p1Time: number } | null>(null)
  // Brush stroke accumulation
  const brushInProgressRef = useRef<{ time: number; value: number }[]>([])
  // Live preview primitive (attached on mousedown, detached on mouseup/Escape)
  type AnyDrawingPrimitive = HorizontalRayPrimitive | PriceRangePrimitive | FibonacciPrimitive | DateRangePrimitive | BrushPrimitive
  const previewRef = useRef<{ primitive: AnyDrawingPrimitive; drawing: Drawing } | null>(null)
  // Overlay crosshair position (shown while a drawing tool is active)
  const [overlayCursor, setOverlayCursor] = useState<{ x: number; y: number; price: number } | null>(null)

  const detachPreview = () => {
    if (!previewRef.current) return
    seriesRef.current?.detachPrimitive(previewRef.current.primitive)
    previewRef.current = null
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        detachPreview()
        drawDragRef.current = null
        brushInProgressRef.current = []
        // keep activeTool unchanged so user can try again immediately
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        removeDrawing(activeSymbol, selectedDrawingId)
      } else if ((e.key === 'z' && (e.metaKey || e.ctrlKey))) {
        undoLastDrawing()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedDrawingId, activeSymbol, removeDrawing, undoLastDrawing])

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (activeTool === 'cursor' || !series || !chart) return

    const price = series.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
    const time = (chart.timeScale().coordinateToTime(e.nativeEvent.offsetX) ?? 0) as number

    if (activeTool === 'brush') {
      brushInProgressRef.current = [{ time, value: price }]
      const drawing: Drawing = { id: '__preview__', type: 'brush', points: [{ time, value: price }], color: activeColor, width: activeWidth }
      const primitive = new BrushPrimitive(drawing, () => {})
      series.attachPrimitive(primitive)
      previewRef.current = { primitive, drawing }
      return
    }

    drawDragRef.current = { startX: e.nativeEvent.offsetX, startY: e.nativeEvent.offsetY, p1Price: price, p1Time: time }

    let primitive: AnyDrawingPrimitive
    let drawing: Drawing
    if (activeTool === 'horizontal_ray') {
      drawing = { id: '__preview__', type: 'horizontal_ray', points: [{ time, value: price }], color: activeColor, width: activeWidth }
      primitive = new HorizontalRayPrimitive(drawing, () => {}, () => {}, () => {})
    } else if (activeTool === 'price_range') {
      drawing = { id: '__preview__', type: 'price_range', points: [{ time: 0, value: price }, { time: 0, value: price }], color: activeColor, width: activeWidth }
      primitive = new PriceRangePrimitive(drawing, () => {}, () => {})
    } else if (activeTool === 'fibonacci') {
      drawing = { id: '__preview__', type: 'fibonacci', points: [{ time, value: price }, { time, value: price }], color: activeColor, width: activeWidth }
      primitive = new FibonacciPrimitive(drawing, () => {}, () => {})
    } else { // date_range
      drawing = { id: '__preview__', type: 'date_range', points: [{ time, value: 0 }, { time, value: 0 }], color: activeColor, width: activeWidth }
      primitive = new DateRangePrimitive(drawing)
    }
    series.attachPrimitive(primitive)
    previewRef.current = { primitive, drawing }
  }

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    const price = series.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
    const time = (chart.timeScale().coordinateToTime(e.nativeEvent.offsetX) ?? 0) as number

    setOverlayCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, price })

    const preview = previewRef.current
    if (!preview) return

    if (activeTool === 'brush') {
      if (brushInProgressRef.current.length === 0) return
      brushInProgressRef.current.push({ time, value: price })
      preview.primitive.updateDrawing({ ...preview.drawing, points: [...brushInProgressRef.current] })
      return
    }

    const drag = drawDragRef.current
    if (!drag) return

    let updatedPoints: { time: number; value: number }[]
    if (activeTool === 'price_range') {
      updatedPoints = [{ time: 0, value: drag.p1Price }, { time: 0, value: price }]
    } else if (activeTool === 'fibonacci') {
      updatedPoints = [{ time: drag.p1Time, value: drag.p1Price }, { time, value: price }]
    } else if (activeTool === 'date_range') {
      updatedPoints = [{ time: drag.p1Time, value: 0 }, { time, value: 0 }]
    } else {
      return // horizontal_ray is fixed at mousedown Y — no update needed
    }
    preview.primitive.updateDrawing({ ...preview.drawing, points: updatedPoints })
  }

  const handleOverlayMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    detachPreview()

    if (activeTool === 'brush') {
      const pts = brushInProgressRef.current
      brushInProgressRef.current = []
      if (pts.length < 2) return
      addDrawing(activeSymbol, {
        id: crypto.randomUUID(),
        type: 'brush',
        points: pts,
        color: activeColor,
        width: activeWidth,
      })
      setActiveTool('cursor')
      return
    }

    const drag = drawDragRef.current
    if (!drag) return
    drawDragRef.current = null

    const dist = Math.hypot(e.nativeEvent.offsetX - drag.startX, e.nativeEvent.offsetY - drag.startY)
    if (dist < 4) return

    if (activeTool === 'horizontal_ray') {
      addDrawing(activeSymbol, {
        id: crypto.randomUUID(),
        type: 'horizontal_ray',
        points: [{ time: drag.p1Time, value: drag.p1Price }],
        color: activeColor,
        width: activeWidth,
      })
    } else if (activeTool === 'price_range') {
      const price2 = seriesRef.current?.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
      addDrawing(activeSymbol, {
        id: crypto.randomUUID(),
        type: 'price_range',
        points: [{ time: 0, value: drag.p1Price }, { time: 0, value: price2 }],
        color: activeColor,
        width: activeWidth,
      })
    } else if (activeTool === 'fibonacci') {
      const price2 = seriesRef.current?.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
      const time2 = (chartRef.current?.timeScale().coordinateToTime(e.nativeEvent.offsetX) ?? 0) as number
      addDrawing(activeSymbol, {
        id: crypto.randomUUID(),
        type: 'fibonacci',
        points: [{ time: drag.p1Time, value: drag.p1Price }, { time: time2, value: price2 }],
        color: activeColor,
        width: activeWidth,
      })
    } else if (activeTool === 'date_range') {
      const time2 = (chartRef.current?.timeScale().coordinateToTime(e.nativeEvent.offsetX) ?? 0) as number
      addDrawing(activeSymbol, {
        id: crypto.randomUUID(),
        type: 'date_range',
        points: [{ time: drag.p1Time, value: 0 }, { time: time2, value: 0 }],
        color: activeColor,
        width: activeWidth,
      })
    }
    setActiveTool('cursor')
  }

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f1117' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e2433' },
        horzLines: { color: '#1e2433' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        horzLine: {
          color: '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#1e2433',
        },
        vertLine: {
          color: '#94a3b8',
          width: 1,
          style: LineStyle.Dashed,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#1e2433',
        },
      },
      rightPriceScale: { borderColor: '#1e2433' },
      timeScale: { borderColor: '#1e2433', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#ffffff',
      downColor: '#808080',
      borderVisible: false,
      wickUpColor: '#ffffff',
      wickDownColor: '#808080',
    })

    const vwap = chart.addSeries(LineSeries, {
      color: '#00BCD4',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    const bl = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    const blSlow = chart.addSeries(LineSeries, {
      color: '#9C27B0',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    // Wire selection via chart click events (cursor mode only — overlay is pointer-events-none)
    chart.subscribeClick((param) => {
      if (!param.hoveredObjectId) {
        useAppStore.getState().setSelectedDrawingId(null)
        return
      }
      const id = param.hoveredObjectId as string
      if (id.startsWith('delete:')) {
        const drawingId = id.slice(7)
        useAppStore.getState().removeDrawing(useAppStore.getState().activeSymbol, drawingId)
      } else {
        useAppStore.getState().setSelectedDrawingId(id)
      }
    })

    chartRef.current = chart
    seriesRef.current = series
    vwapRef.current = vwap
    blRef.current = bl
    blSlowRef.current = blSlow
    onChartReady?.(chart)

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync drawing primitives with store — mount/unmount/update as drawings change
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    // --- horizontal_ray + price_range ---
    const current = primitivesRef.current
    const currentIds = new Set(current.keys())
    const supportedTypes = new Set(['horizontal_ray', 'price_range'])
    const newIds = new Set(drawings.filter(d => supportedTypes.has(d.type)).map(d => d.id))

    for (const id of currentIds) {
      if (!newIds.has(id)) {
        series.detachPrimitive(current.get(id)!)
        current.delete(id)
      }
    }

    for (const drawing of drawings) {
      if (drawing.type === 'horizontal_ray') {
        if (!current.has(drawing.id)) {
          const primitive = new HorizontalRayPrimitive(
            drawing,
            (id) => setSelectedDrawingId(id),
            (id) => removeDrawing(activeSymbol, id),
            (id, newPrice) => updateDrawing(activeSymbol, id, { points: [{ time: 0, value: newPrice }] }),
          )
          series.attachPrimitive(primitive)
          current.set(drawing.id, primitive)
        } else {
          current.get(drawing.id)!.updateDrawing(drawing)
        }
        current.get(drawing.id)!.setSelected(selectedDrawingId === drawing.id)
      } else if (drawing.type === 'price_range') {
        if (!current.has(drawing.id)) {
          const primitive = new PriceRangePrimitive(
            drawing,
            (id) => setSelectedDrawingId(id),
            (id) => removeDrawing(activeSymbol, id),
          )
          series.attachPrimitive(primitive)
          current.set(drawing.id, primitive)
        } else {
          current.get(drawing.id)!.updateDrawing(drawing)
        }
        current.get(drawing.id)!.setSelected(selectedDrawingId === drawing.id)
      }
    }

    // --- fibonacci ---
    const fibCurrent = fibPrimitivesRef.current
    const fibCurrentIds = new Set(fibCurrent.keys())
    const newFibIds = new Set(drawings.filter(d => d.type === 'fibonacci').map(d => d.id))

    for (const id of fibCurrentIds) {
      if (!newFibIds.has(id)) {
        series.detachPrimitive(fibCurrent.get(id)!)
        fibCurrent.delete(id)
      }
    }

    for (const drawing of drawings) {
      if (drawing.type !== 'fibonacci') continue
      if (!fibCurrent.has(drawing.id)) {
        const primitive = new FibonacciPrimitive(
          drawing,
          (id) => setSelectedDrawingId(id),
          (id) => removeDrawing(activeSymbol, id),
        )
        series.attachPrimitive(primitive)
        fibCurrent.set(drawing.id, primitive)
      } else {
        fibCurrent.get(drawing.id)!.updateDrawing(drawing)
      }
      fibCurrent.get(drawing.id)!.setSelected(selectedDrawingId === drawing.id)
    }

    // --- date_range ---
    const drCurrent = dateRangePrimitivesRef.current
    const drCurrentIds = new Set(drCurrent.keys())
    const newDrIds = new Set(drawings.filter(d => d.type === 'date_range').map(d => d.id))

    for (const id of drCurrentIds) {
      if (!newDrIds.has(id)) {
        series.detachPrimitive(drCurrent.get(id)!)
        drCurrent.delete(id)
      }
    }

    for (const drawing of drawings) {
      if (drawing.type !== 'date_range') continue
      if (!drCurrent.has(drawing.id)) {
        const primitive = new DateRangePrimitive(drawing)
        series.attachPrimitive(primitive)
        drCurrent.set(drawing.id, primitive)
      } else {
        drCurrent.get(drawing.id)!.updateDrawing(drawing)
      }
    }

    // --- brush ---
    const brushCurrent = brushPrimitivesRef.current
    const brushCurrentIds = new Set(brushCurrent.keys())
    const newBrushIds = new Set(drawings.filter(d => d.type === 'brush').map(d => d.id))

    for (const id of brushCurrentIds) {
      if (!newBrushIds.has(id)) {
        series.detachPrimitive(brushCurrent.get(id)!)
        brushCurrent.delete(id)
      }
    }

    for (const drawing of drawings) {
      if (drawing.type !== 'brush') continue
      if (!brushCurrent.has(drawing.id)) {
        const primitive = new BrushPrimitive(drawing, (id) => setSelectedDrawingId(id))
        series.attachPrimitive(primitive)
        brushCurrent.set(drawing.id, primitive)
      } else {
        brushCurrent.get(drawing.id)!.updateDrawing(drawing)
      }
    }
  }, [drawings, selectedDrawingId, activeSymbol, setSelectedDrawingId, removeDrawing, updateDrawing])

  // Drag: mousedown on ControlPoint → track mousemove to reposition the selected ray
  useEffect(() => {
    const container = containerRef.current
    const series = seriesRef.current
    if (!container || !series) return

    const onMouseDown = (e: MouseEvent) => {
      if (!selectedDrawingId) return
      const primitive = primitivesRef.current.get(selectedDrawingId)
      if (!primitive) return
      const hit = primitive.hitTest(e.offsetX, e.offsetY)
      if (hit && !hit.externalId.startsWith('delete:')) {
        const price = series.coordinateToPrice(e.offsetY) ?? 0
        dragRef.current = { id: selectedDrawingId, startY: e.offsetY, startPrice: price }
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const newPrice = series.coordinateToPrice(e.offsetY) ?? 0
      updateDrawing(activeSymbol, dragRef.current.id, { points: [{ time: 0, value: newPrice }] })
    }

    const onMouseUp = () => { dragRef.current = null }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseup', onMouseUp)
    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseup', onMouseUp)
    }
  }, [selectedDrawingId, activeSymbol, updateDrawing])

  // Full reload: only when historical klines change (symbol/interval switch)
  useEffect(() => {
    if (!seriesRef.current || !klines.length) return
    seriesRef.current.setData(
      klines.map((k) => ({
        time: k.time as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }))
    )
    chartRef.current?.timeScale().fitContent()
  }, [klines])

  // VWAP full reload: recompute when klines, anchor, or enabled changes
  useEffect(() => {
    if (!vwapRef.current || !klines.length) return
    if (!vwapEnabled) {
      vwapRef.current.setData([])
      return
    }
    const values = computeVwap(klines, vwapAnchor)
    vwapRef.current.setData(
      klines
        .map((k, i) => ({ time: k.time as Time, value: values[i] }))
        .filter((d): d is { time: Time; value: number } => d.value !== null)
    )
  }, [klines, vwapEnabled, vwapAnchor])

  // Baseline full reload
  useEffect(() => {
    if (!blRef.current || !blSlowRef.current || !klines.length) return
    const { fast, slow } = computeBaseline(klines)
    blRef.current.setData(
      blEnabled
        ? klines.map((k, i) => ({ time: k.time as Time, value: fast[i] }))
        : []
    )
    blSlowRef.current.setData(
      blSlowEnabled
        ? klines.map((k, i) => ({ time: k.time as Time, value: slow[i] }))
        : []
    )
  }, [klines, blEnabled, blSlowEnabled])

  // Live update: update last candle in-place without touching the viewport
  useEffect(() => {
    if (!seriesRef.current || !liveCandle) return
    seriesRef.current.update({
      time: liveCandle.time as Time,
      open: liveCandle.open,
      high: liveCandle.high,
      low: liveCandle.low,
      close: liveCandle.close,
    })
    if (vwapRef.current && vwapEnabled && klines.length) {
      const value = computeVwapLive(klines, liveCandle, vwapAnchor)
      if (value !== null) vwapRef.current.update({ time: liveCandle.time as Time, value })
    }
    if (klines.length) {
      const { fast, slow } = computeBaselineLive(klines, liveCandle)
      if (blRef.current && blEnabled) blRef.current.update({ time: liveCandle.time as Time, value: fast })
      if (blSlowRef.current && blSlowEnabled) blSlowRef.current.update({ time: liveCandle.time as Time, value: slow })
    }
  }, [liveCandle]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex-1 min-w-0 min-h-0 flex">
      <DrawingToolbar />
      <div className="relative flex-1 min-w-0 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0f1117]/80">
            <span className="text-slate-400 text-sm">Loading chart…</span>
          </div>
        )}
        <div
          data-drawing-overlay
          onMouseDown={handleOverlayMouseDown}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={() => setOverlayCursor(null)}
          className={`absolute inset-0 z-10 ${activeTool === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
          {overlayCursor && activeTool !== 'cursor' && (
            <>
              {/* horizontal dashed line */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: overlayCursor.y,
                  height: 1,
                  backgroundImage: 'repeating-linear-gradient(to right, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 8px)',
                }}
              />
              {/* vertical dashed line */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: overlayCursor.x,
                  width: 1,
                  backgroundImage: 'repeating-linear-gradient(to bottom, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 8px)',
                }}
              />
              {/* price label on right edge */}
              <div
                className="absolute right-0 pointer-events-none px-1 text-xs text-slate-300 bg-[#1e2433] border border-[#334155] -translate-y-1/2"
                style={{ top: overlayCursor.y }}
              >
                {overlayCursor.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </>
          )}
        </div>
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
