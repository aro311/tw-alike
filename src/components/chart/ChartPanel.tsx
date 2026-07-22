import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import type { Kline, VwapAnchor } from '@/types'
import { computeVwap, computeVwapLive } from '@/lib/vwap'
import { computeBaseline, computeBaselineLive } from '@/lib/baseline'
import { computeVolumeSMA } from '@/lib/volumeMA'
import { computeDisplayRemainingMs, formatCountdown } from '@/lib/countdown'
import { DrawingToolbar } from './DrawingToolbar'
import { DrawingEditDialog } from './DrawingEditDialog'
import { useAppStore } from '@/store'
import { HorizontalRayPrimitive } from '@/lib/drawings/HorizontalRayPrimitive'
import { PriceRangePrimitive } from '@/lib/drawings/PriceRangePrimitive'
import { FibonacciPrimitive } from '@/lib/drawings/FibonacciPrimitive'
import { DateRangePrimitive } from '@/lib/drawings/DateRangePrimitive'
import { BrushPrimitive } from '@/lib/drawings/BrushPrimitive'
import type { Drawing } from '@/types'

const EMPTY_DRAWINGS: Drawing[] = []

function coordinateToTimeExtrapolated(chart: IChartApi, offsetX: number, klines: Kline[]): number | null {
  const rawTime = chart.timeScale().coordinateToTime(offsetX)
  if (rawTime !== null) return rawTime as number
  if (klines.length < 2) return null
  const lastBar = klines[klines.length - 1]
  const prevBar = klines[klines.length - 2]
  const barInterval = lastBar.time - prevBar.time
  const lastBarX = chart.timeScale().timeToCoordinate(lastBar.time as Time)
  const prevBarX = chart.timeScale().timeToCoordinate(prevBar.time as Time)
  if (lastBarX === null || prevBarX === null || lastBarX === prevBarX) return null
  const pixelsPerBar = lastBarX - prevBarX
  const barsOffset = Math.round((offsetX - lastBarX) / pixelsPerBar)
  return lastBar.time + barsOffset * barInterval
}

interface Props {
  klines: Kline[]
  liveCandle: Kline | null
  loading: boolean
  onChartReady?: (chart: IChartApi) => void
  vwapEnabled: boolean
  vwapAnchor: VwapAnchor
  blEnabled: boolean
  blSlowEnabled: boolean
  volumeEnabled?: boolean
}

export function ChartPanel({ klines, liveCandle, loading, onChartReady, vwapEnabled, vwapAnchor, blEnabled, blSlowEnabled, volumeEnabled = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null)
  const vwapRef = useRef<ISeriesApi<'Line', Time> | null>(null)
  const blRef = useRef<ISeriesApi<'Line', Time> | null>(null)
  const blSlowRef = useRef<ISeriesApi<'Line', Time> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram', Time> | null>(null)
  const volumeMARef = useRef<ISeriesApi<'Line', Time> | null>(null)

  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const activeColor = useAppStore((s) => s.activeColor)
  const activeWidth = useAppStore((s) => s.activeWidth)
  const activeSymbol = useAppStore((s) => s.activeSymbol)
  const interval = useAppStore((s) => s.getSymbolSettings(s.activeSymbol).interval)
  const selectedDrawingId = useAppStore((s) => s.selectedDrawingId)
  const setSelectedDrawingId = useAppStore((s) => s.setSelectedDrawingId)
  const addDrawing = useAppStore((s) => s.addDrawing)
  const removeDrawing = useAppStore((s) => s.removeDrawing)
  const updateDrawing = useAppStore((s) => s.updateDrawing)
  const undoLastDrawing = useAppStore((s) => s.undoLastDrawing)
  // Read drawings directly from symbolSettings to avoid creating a new object on every render
  const drawings = useAppStore((s) => s.symbolSettings[s.activeSymbol]?.drawings ?? EMPTY_DRAWINGS)

  // Map of drawing id → primitive instance (HorizontalRayPrimitive only)
  const primitivesRef = useRef<Map<string, HorizontalRayPrimitive>>(new Map())
  const fibPrimitivesRef = useRef<Map<string, FibonacciPrimitive>>(new Map())
  const priceRangePrimitivesRef = useRef<Map<string, PriceRangePrimitive>>(new Map())
  const dateRangePrimitivesRef = useRef<Map<string, DateRangePrimitive>>(new Map())
  const brushPrimitivesRef = useRef<Map<string, BrushPrimitive>>(new Map())
  // Track drag state for ControlPoint repositioning (existing drawings)
  const dragRef = useRef<{
    id: string
    pointerId: number
    startY: number
    startPrice: number
    p1Time: number
    isAnchorDrag: boolean
    fibAnchorIndex?: 0 | 1
    fibOtherPoint?: { time: number; value: number }
    priceRangeAnchorIndex?: 0 | 1
    priceRangeOtherPoint?: { time: number; value: number }
    priceRangeInteriorPoints?: [{ time: number; value: number }, { time: number; value: number }]
  } | null>(null)
  const overlayPointerIdRef = useRef<number | null>(null)
  // Click-click placement state — set on first click, cleared on second click or Escape
  const drawPlacementRef = useRef<{ startX: number; startY: number; p1Price: number; p1Time: number; lastValidEndTime: number } | null>(null)
  // Brush stroke accumulation
  const brushInProgressRef = useRef<{ time: number; value: number }[]>([])
  // Live preview primitive (attached on mousedown, detached on mouseup/Escape)
  type AnyDrawingPrimitive = HorizontalRayPrimitive | PriceRangePrimitive | FibonacciPrimitive | DateRangePrimitive | BrushPrimitive
  const previewRef = useRef<{ primitive: AnyDrawingPrimitive; drawing: Drawing } | null>(null)
  // Overlay crosshair position (shown while a drawing tool is active)
  const [overlayCursor, setOverlayCursor] = useState<{ x: number; y: number; price: number } | null>(null)
  // Ticks every second to drive the candle-close countdown label
  const [now, setNow] = useState(() => Date.now())
  const [priceScaleWidth, setPriceScaleWidth] = useState(65)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  // True between first and second click while a two-point drawing is being placed

  // ID of the drawing being edited via double-click dialog
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null)

  const detachPreview = () => {
    if (!previewRef.current) return
    seriesRef.current?.detachPrimitive(previewRef.current.primitive)
    previewRef.current = null
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        detachPreview()
        drawPlacementRef.current = null
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

  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (overlayPointerIdRef.current !== null) return
    overlayPointerIdRef.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const series = seriesRef.current
    if (activeTool === 'cursor' || !series) return

    if (activeTool === 'brush') {
      const price = series.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
      const time = (coordinateToTimeExtrapolated(chartRef.current!, e.nativeEvent.offsetX, klines) ?? 0) as number
      brushInProgressRef.current = [{ time, value: price }]
      const drawing: Drawing = { id: '__preview__', type: 'brush', points: [{ time, value: price }], color: activeColor, width: activeWidth }
      const primitive = new BrushPrimitive(drawing, () => {}, () => {})
      series.attachPrimitive(primitive)
      previewRef.current = { primitive, drawing }
    }
    // All other tools: logic runs on pointerUp
  }

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (overlayPointerIdRef.current !== null && e.pointerId !== overlayPointerIdRef.current) return
    const series = seriesRef.current
    const chart = chartRef.current
    if (!series || !chart) return

    const price = series.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
    const time = (coordinateToTimeExtrapolated(chart, e.nativeEvent.offsetX, klines) ?? drawPlacementRef.current?.lastValidEndTime ?? 0) as number
    if (drawPlacementRef.current) drawPlacementRef.current.lastValidEndTime = time

    setOverlayCursor({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, price })

    const preview = previewRef.current
    if (!preview) return

    if (activeTool === 'brush') {
      if (brushInProgressRef.current.length === 0) return
      brushInProgressRef.current.push({ time, value: price })
      preview.primitive.updateDrawing({ ...preview.drawing, points: [...brushInProgressRef.current] })
      return
    }

    const drag = drawPlacementRef.current
    if (!drag) return

    let updatedPoints: { time: number; value: number }[]
    if (activeTool === 'price_range') {
      updatedPoints = [{ time: drag.p1Time, value: drag.p1Price }, { time: time, value: price }]
    } else if (activeTool === 'fibonacci') {
      updatedPoints = [{ time: drag.p1Time, value: drag.p1Price }, { time, value: price }]
    } else if (activeTool === 'date_range') {
      updatedPoints = [{ time: drag.p1Time, value: 0 }, { time, value: 0 }]
    } else {
      return // horizontal_ray is fixed at mousedown Y — no update needed
    }
    preview.primitive.updateDrawing({ ...preview.drawing, points: updatedPoints })
  }

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== overlayPointerIdRef.current) return
    overlayPointerIdRef.current = null
    const series = seriesRef.current
    const chart = chartRef.current
    if (activeTool === 'cursor' || !series || !chart) return

    const price = series.coordinateToPrice(e.nativeEvent.offsetY) ?? 0
    const time = (coordinateToTimeExtrapolated(chart, e.nativeEvent.offsetX, klines) ?? 0) as number

    if (activeTool === 'brush') {
      detachPreview()
      const pts = brushInProgressRef.current
      brushInProgressRef.current = []
      if (pts.length < 2) return
      addDrawing(activeSymbol, { id: crypto.randomUUID(), type: 'brush', points: pts, color: activeColor, width: activeWidth })
      setActiveTool('cursor')
      return
    }

    if (activeTool === 'horizontal_ray') {
      addDrawing(activeSymbol, { id: crypto.randomUUID(), type: 'horizontal_ray', points: [{ time, value: price }], color: activeColor, width: activeWidth })
      setActiveTool('cursor')
      return
    }

    const placement = drawPlacementRef.current

    if (!placement) {
      // First tap — anchor first point, attach preview
      drawPlacementRef.current = { startX: e.nativeEvent.offsetX, startY: e.nativeEvent.offsetY, p1Price: price, p1Time: time, lastValidEndTime: time }
      let primitive: AnyDrawingPrimitive
      let drawing: Drawing
      if (activeTool === 'price_range') {
        drawing = { id: '__preview__', type: 'price_range', points: [{ time, value: price }, { time, value: price }], color: activeColor, width: activeWidth }
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
    } else {
      // Second tap — commit
      const endTime = (coordinateToTimeExtrapolated(chart, e.nativeEvent.offsetX, klines) ?? placement.lastValidEndTime) as number
      detachPreview()
      drawPlacementRef.current = null
      if (activeTool === 'price_range') {
        addDrawing(activeSymbol, { id: crypto.randomUUID(), type: 'price_range', points: [{ time: placement.p1Time, value: placement.p1Price }, { time: endTime, value: price }], color: activeColor, width: activeWidth })
      } else if (activeTool === 'fibonacci') {
        addDrawing(activeSymbol, { id: crypto.randomUUID(), type: 'fibonacci', points: [{ time: placement.p1Time, value: placement.p1Price }, { time: endTime, value: price }], color: activeColor, width: activeWidth })
      } else { // date_range
        addDrawing(activeSymbol, { id: crypto.randomUUID(), type: 'date_range', points: [{ time: placement.p1Time, value: 0 }, { time: endTime, value: 0 }], color: activeColor, width: activeWidth })
      }
      setActiveTool('cursor')
    }
  }

  // Cancel any in-progress placement when the active tool changes
  useEffect(() => {
    if (drawPlacementRef.current) {
      detachPreview()
      drawPlacementRef.current = null
    }
  }, [activeTool])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f1117' },
        textColor: '#3b82f6',
      },
      grid: {
        vertLines: { color: '#1e2433' },
        horzLines: { color: '#1e2433' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: LineStyle.Dashed,
          visible: true,
          labelVisible: true,
          labelBackgroundColor: '#1e2433',
        },
        vertLine: {
          color: '#3b82f6',
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
      lastValueVisible: false,
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

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      priceLineVisible: false,
      lastValueVisible: false,
    })
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    })

    const volumeMA = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 1,
      priceScaleId: '',
      priceLineVisible: false,
      lastValueVisible: false,
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

    // Wire double-click to open the edit dialog for editable drawing types.
    // param.hoveredObjectId is unreliable in the browser: the React re-render triggered
    // by the first click's setSelectedDrawingId fires requestUpdate(), which causes LW
    // Charts to clear _internal_hoveredSource() before the dblclick fires. When
    // hoveredObjectId is absent we fall back to a manual hit test at param.point.
    chart.subscribeDblClick((param) => {
      const state = useAppStore.getState()
      if (state.activeTool !== 'cursor') return

      type HittablePrimitive = { hitTest(x: number, y: number): { externalId: string } | null }

      let hitId: string | null = null
      const rawId = param.hoveredObjectId as string | undefined
      if (rawId && !rawId.startsWith('anchor') && !rawId.startsWith('delete:')) {
        hitId = rawId
      } else if (param.point) {
        const { x, y } = param.point
        const candidates: [string, HittablePrimitive][] = [
          ...primitivesRef.current,
          ...fibPrimitivesRef.current,
          ...priceRangePrimitivesRef.current,
        ]
        const hit = candidates.find(([, prim]) => {
          const result = prim.hitTest(x, y)
          return result && !result.externalId.startsWith('anchor') && !result.externalId.startsWith('delete:')
        })
        if (hit) hitId = hit[0]
      }

      if (!hitId) return
      const symbol = state.activeSymbol
      const drawing = state.getSymbolSettings(symbol).drawings.find((d) => d.id === hitId)
      if (!drawing) return
      if (drawing.type === 'horizontal_ray' || drawing.type === 'fibonacci' || drawing.type === 'price_range') {
        setEditingDrawingId(hitId)
      }
    })

    chartRef.current = chart
    seriesRef.current = series
    vwapRef.current = vwap
    blRef.current = bl
    blSlowRef.current = blSlow
    volumeRef.current = volume
    volumeMARef.current = volumeMA
    onChartReady?.(chart)

    const updatePriceScaleWidth = () => {
      if (!containerRef.current) return
      const paneW = chart.paneSize().width
      const containerW = containerRef.current.clientWidth
      setPriceScaleWidth(Math.max(50, containerW - paneW))
    }

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
        updatePriceScaleWidth()
      }
    })
    observer.observe(containerRef.current)
    // Initial measurement after chart has laid out
    setTimeout(updatePriceScaleWidth, 0)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync drawing primitives with store — mount/unmount/update as drawings change
  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    // --- horizontal_ray ---
    const current = primitivesRef.current
    const currentIds = new Set(current.keys())
    const newIds = new Set(drawings.filter(d => d.type === 'horizontal_ray').map(d => d.id))

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
      }
    }

    // --- price_range ---
    const prCurrent = priceRangePrimitivesRef.current
    const prCurrentIds = new Set(prCurrent.keys())
    const newPrIds = new Set(drawings.filter(d => d.type === 'price_range').map(d => d.id))

    for (const id of prCurrentIds) {
      if (!newPrIds.has(id)) {
        series.detachPrimitive(prCurrent.get(id)!)
        prCurrent.delete(id)
      }
    }

    for (const drawing of drawings) {
      if (drawing.type === 'price_range') {
        if (!prCurrent.has(drawing.id)) {
          const primitive = new PriceRangePrimitive(
            drawing,
            (id) => setSelectedDrawingId(id),
            (id) => removeDrawing(activeSymbol, id),
          )
          series.attachPrimitive(primitive)
          prCurrent.set(drawing.id, primitive)
        } else {
          prCurrent.get(drawing.id)!.updateDrawing(drawing)
        }
        prCurrent.get(drawing.id)!.setSelected(selectedDrawingId === drawing.id)
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
        const primitive = new BrushPrimitive(
          drawing,
          (id) => setSelectedDrawingId(id),
          (id) => removeDrawing(activeSymbol, id),
        )
        series.attachPrimitive(primitive)
        brushCurrent.set(drawing.id, primitive)
      } else {
        brushCurrent.get(drawing.id)!.updateDrawing(drawing)
      }
      brushCurrent.get(drawing.id)!.setSelected(selectedDrawingId === drawing.id)
    }
  }, [drawings, selectedDrawingId, activeSymbol, setSelectedDrawingId, removeDrawing, updateDrawing])

  // Drag: mousedown on ControlPoint → track mousemove to reposition the selected ray
  useEffect(() => {
    const container = containerRef.current
    const series = seriesRef.current
    const chart = chartRef.current
    if (!container || !series || !chart) return

    const onPointerDown = (e: PointerEvent) => {
      if (dragRef.current) return
      if (!selectedDrawingId) return
      const fibPrimitive = fibPrimitivesRef.current.get(selectedDrawingId)
      if (fibPrimitive) {
        const hit = fibPrimitive.hitTest(e.offsetX, e.offsetY)
        if (!hit || hit.externalId.startsWith('delete:')) return
        if (hit.externalId.startsWith('anchor0:') || hit.externalId.startsWith('anchor1:')) {
          const anchorIndex = hit.externalId.startsWith('anchor0:') ? 0 : 1
          const otherPoint = fibPrimitive.drawing.points[1 - anchorIndex]
          const draggedPointTime = (fibPrimitive.drawing.points[anchorIndex]?.time as number) ?? 0
          container.setPointerCapture(e.pointerId)
          dragRef.current = {
            id: selectedDrawingId,
            pointerId: e.pointerId,
            startY: e.offsetY,
            startPrice: series.coordinateToPrice(e.offsetY) ?? 0,
            p1Time: draggedPointTime,
            isAnchorDrag: true,
            fibAnchorIndex: anchorIndex,
            fibOtherPoint: otherPoint,
          }
          chart.applyOptions({ handleScroll: false, handleScale: false })
        }
        return
      }

      const prPrimitive = priceRangePrimitivesRef.current.get(selectedDrawingId)
      if (prPrimitive) {
        const hit = prPrimitive.hitTest(e.offsetX, e.offsetY)
        if (!hit) return
        const startPrice = series.coordinateToPrice(e.offsetY) ?? 0
        const startTime = (coordinateToTimeExtrapolated(chart, e.offsetX, klines) ?? 0) as number
        if (hit.externalId.startsWith('anchor0:') || hit.externalId.startsWith('anchor1:')) {
          const anchorIndex = hit.externalId.startsWith('anchor0:') ? 0 : 1
          const otherPoint = prPrimitive.drawing.points[1 - anchorIndex]
          container.setPointerCapture(e.pointerId)
          dragRef.current = {
            id: selectedDrawingId,
            pointerId: e.pointerId,
            startY: e.offsetY,
            startPrice,
            p1Time: startTime,
            isAnchorDrag: true,
            priceRangeAnchorIndex: anchorIndex,
            priceRangeOtherPoint: otherPoint,
          }
        } else {
          // Interior drag — translate both points
          const p0 = prPrimitive.drawing.points[0]
          const p1 = prPrimitive.drawing.points[1]
          container.setPointerCapture(e.pointerId)
          dragRef.current = {
            id: selectedDrawingId,
            pointerId: e.pointerId,
            startY: e.offsetY,
            startPrice,
            p1Time: startTime,
            isAnchorDrag: false,
            priceRangeInteriorPoints: [
              { time: p0?.time as number ?? 0, value: p0?.value ?? 0 },
              { time: p1?.time as number ?? 0, value: p1?.value ?? 0 },
            ],
          }
        }
        chart.applyOptions({ handleScroll: false, handleScale: false })
        return
      }

      const primitive = primitivesRef.current.get(selectedDrawingId)
      if (!primitive) return
      const hit = primitive.hitTest(e.offsetX, e.offsetY)
      if (!hit || hit.externalId.startsWith('delete:')) return
      const price = series.coordinateToPrice(e.offsetY) ?? 0
      const existingTime = (primitive.drawing.points[0]?.time as number) ?? 0
      const isAnchorDrag = hit.externalId.startsWith('anchor:')
      container.setPointerCapture(e.pointerId)
      dragRef.current = { id: selectedDrawingId, pointerId: e.pointerId, startY: e.offsetY, startPrice: price, p1Time: existingTime, isAnchorDrag }
      chart.applyOptions({ handleScroll: false, handleScale: false })
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return
      const newPrice = series.coordinateToPrice(e.offsetY) ?? 0
      if (dragRef.current.fibAnchorIndex !== undefined && dragRef.current.fibOtherPoint) {
        const newTime = coordinateToTimeExtrapolated(chart, e.offsetX, klines) ?? dragRef.current.p1Time
        dragRef.current.p1Time = newTime
        const newPoint = { time: newTime, value: newPrice }
        const points = dragRef.current.fibAnchorIndex === 0
          ? [newPoint, dragRef.current.fibOtherPoint]
          : [dragRef.current.fibOtherPoint, newPoint]
        updateDrawing(activeSymbol, dragRef.current.id, { points })
      } else if (dragRef.current.priceRangeAnchorIndex !== undefined && dragRef.current.priceRangeOtherPoint) {
        const newTime = coordinateToTimeExtrapolated(chart, e.offsetX, klines) ?? dragRef.current.p1Time
        dragRef.current.p1Time = newTime
        const newPoint = { time: newTime, value: newPrice }
        const points = dragRef.current.priceRangeAnchorIndex === 0
          ? [newPoint, dragRef.current.priceRangeOtherPoint]
          : [dragRef.current.priceRangeOtherPoint, newPoint]
        updateDrawing(activeSymbol, dragRef.current.id, { points })
      } else if (dragRef.current.priceRangeInteriorPoints) {
        const newTime = (coordinateToTimeExtrapolated(chart, e.offsetX, klines) ?? dragRef.current.p1Time) as number
        const deltaTime = newTime - dragRef.current.p1Time
        const deltaPrice = newPrice - dragRef.current.startPrice
        const [ip0, ip1] = dragRef.current.priceRangeInteriorPoints
        updateDrawing(activeSymbol, dragRef.current.id, {
          points: [
            { time: ip0.time + deltaTime, value: ip0.value + deltaPrice },
            { time: ip1.time + deltaTime, value: ip1.value + deltaPrice },
          ],
        })
      } else if (dragRef.current.isAnchorDrag) {
        const newTime = coordinateToTimeExtrapolated(chart, e.offsetX, klines) ?? dragRef.current.p1Time
        updateDrawing(activeSymbol, dragRef.current.id, { points: [{ time: newTime, value: newPrice }] })
      } else {
        updateDrawing(activeSymbol, dragRef.current.id, { points: [{ time: dragRef.current.p1Time, value: newPrice }] })
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return
      chart.applyOptions({ handleScroll: true, handleScale: true })
      dragRef.current = null
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerUp)
    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerUp)
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

  // Volume full reload + candlestick margin adjustment
  useEffect(() => {
    if (!volumeRef.current || !volumeMARef.current || !seriesRef.current) return
    if (!volumeEnabled || !klines.length) {
      volumeRef.current.setData([])
      volumeMARef.current.setData([])
      seriesRef.current.priceScale().applyOptions({ scaleMargins: { top: 0, bottom: 0 } })
      return
    }
    seriesRef.current.priceScale().applyOptions({ scaleMargins: { top: 0, bottom: 0.2 } })
    volumeRef.current.setData(
      klines.map((k) => ({
        time: k.time as Time,
        value: k.volume,
        color: k.close >= k.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
      }))
    )
    const smaValues = computeVolumeSMA(klines)
    volumeMARef.current.setData(
      klines
        .map((k, i) => ({ time: k.time as Time, value: smaValues[i] }))
        .filter((d): d is { time: Time; value: number } => d.value !== null)
    )
  }, [klines, volumeEnabled])

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
    if (volumeEnabled && volumeRef.current && volumeMARef.current && klines.length) {
      volumeRef.current.update({
        time: liveCandle.time as Time,
        value: liveCandle.volume,
        color: liveCandle.close >= liveCandle.open ? 'rgba(38,166,154,0.5)' : 'rgba(239,83,80,0.5)',
      })
      const period = 20
      const volumes = klines.map((k) => k.volume)
      const lastIdx = klines.length - 1
      if (klines[lastIdx]?.time === liveCandle.time) volumes[lastIdx] = liveCandle.volume
      if (volumes.length >= period) {
        const sum = volumes.slice(volumes.length - period).reduce((a, b) => a + b, 0)
        volumeMARef.current.update({ time: liveCandle.time as Time, value: sum / period })
      }
    }
  }, [liveCandle]) // eslint-disable-line react-hooks/exhaustive-deps

  const editingDrawing = editingDrawingId
    ? drawings.find((d) => d.id === editingDrawingId) ?? null
    : null

  const lastCandle = liveCandle ?? klines[klines.length - 1] ?? null
  const countdownLabel = lastCandle ? formatCountdown(computeDisplayRemainingMs(lastCandle.time, interval, now)) : null
  const countdownY = lastCandle ? seriesRef.current?.priceToCoordinate(lastCandle.close) ?? null : null

  return (
    <div className="relative flex-1 min-w-0 min-h-0 flex">
      <DrawingToolbar />
      {editingDrawing && (
        <DrawingEditDialog
          drawing={editingDrawing}
          onConfirm={(points) => {
            updateDrawing(activeSymbol, editingDrawing.id, { points })
            setEditingDrawingId(null)
          }}
          onCancel={() => setEditingDrawingId(null)}
        />
      )}
      <div className="relative flex-1 min-w-0 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0f1117]/80">
            <span className="text-slate-400 text-sm">Loading chart…</span>
          </div>
        )}
        <div
          data-drawing-overlay
          onPointerDown={handleOverlayPointerDown}
          onPointerMove={handleOverlayPointerMove}
          onPointerUp={handleOverlayPointerUp}
          onPointerLeave={() => { overlayPointerIdRef.current = null; setOverlayCursor(null) }}
          className={`absolute inset-0 z-10 ${activeTool === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'}`}
        >
          {overlayCursor && activeTool !== 'cursor' && (
            <>
              {/* horizontal dashed line */}
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  top: overlayCursor.y,
                  height: 1,
                  backgroundImage: 'repeating-linear-gradient(to right, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)',
                }}
              />
              {/* vertical dashed line */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: overlayCursor.x,
                  width: 1,
                  backgroundImage: 'repeating-linear-gradient(to bottom, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)',
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
        {countdownLabel !== null && countdownY !== null && lastCandle !== null && (
          <div
            className="absolute right-0 pointer-events-none flex flex-col items-center justify-center text-[11px] leading-tight text-black bg-white -translate-y-1/2 z-20"
            style={{ top: countdownY, width: priceScaleWidth }}
          >
            <span>{lastCandle.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>{countdownLabel}</span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
