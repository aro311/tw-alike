import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time, LogicalRange } from 'lightweight-charts'
import type { Kline } from '@/types'
import { computeRsi } from '@/lib/rsi'
import { computeEma, computeWma } from '@/lib/ma'

const EMA_PERIOD = 9
const WMA_PERIOD = 45

interface Props {
  klines: Kline[]
  liveCandle: Kline | null
  period: number
  overbought: number
  oversold: number
  onChartReady: (chart: IChartApi) => void
  syncRange: LogicalRange | null
}

type LineRef = ISeriesApi<'Line', Time>

export function RsiPanel({ klines, liveCandle, period, overbought, oversold, onChartReady, syncRange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiRef = useRef<LineRef | null>(null)
  const emaRef = useRef<LineRef | null>(null)
  const wmaRef = useRef<LineRef | null>(null)
  const obRef = useRef<LineRef | null>(null)
  const osRef = useRef<LineRef | null>(null)
  const ob80Ref = useRef<LineRef | null>(null)
  const os20Ref = useRef<LineRef | null>(null)
  const [hoverValues, setHoverValues] = useState<{ rsi: number | null; ema: number | null; wma: number | null }>({ rsi: null, ema: null, wma: null })

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
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e2433', scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: '#1e2433', timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    rsiRef.current = chart.addSeries(LineSeries, {
      color: '#e2e8f0',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    emaRef.current = chart.addSeries(LineSeries, {
      color: '#facc15',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    })

    wmaRef.current = chart.addSeries(LineSeries, {
      color: '#ef5350',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: false,
    })

    // Overbought / oversold level lines
    obRef.current = chart.addSeries(LineSeries, {
      color: '#ef535055',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    osRef.current = chart.addSeries(LineSeries, {
      color: '#26a69a55',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    ob80Ref.current = chart.addSeries(LineSeries, {
      color: '#ef5350',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    os20Ref.current = chart.addSeries(LineSeries, {
      color: '#26a69a',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setHoverValues({ rsi: null, ema: null, wma: null })
        return
      }
      const rsiPoint = rsiRef.current ? param.seriesData.get(rsiRef.current) : undefined
      const emaPoint = emaRef.current ? param.seriesData.get(emaRef.current) : undefined
      const wmaPoint = wmaRef.current ? param.seriesData.get(wmaRef.current) : undefined
      setHoverValues({
        rsi: rsiPoint && 'value' in rsiPoint ? (rsiPoint.value as number) : null,
        ema: emaPoint && 'value' in emaPoint ? (emaPoint.value as number) : null,
        wma: wmaPoint && 'value' in wmaPoint ? (wmaPoint.value as number) : null,
      })
    })

    chartRef.current = chart
    onChartReady(chart)

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
      chartRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Full reload when klines change
  useEffect(() => {
    if (!rsiRef.current || !klines.length) return

    const closes = klines.map((k) => k.close)
    const rsiValues = computeRsi(closes, period)

    // Filter out nulls, keeping index alignment for time mapping
    const rsiData = klines
      .map((k, i) => rsiValues[i] !== null ? { time: k.time as Time, value: rsiValues[i]! } : null)
      .filter((d): d is { time: Time; value: number } => d !== null)

    rsiRef.current.setData(rsiData)

    // EMA and WMA of RSI values
    const rsiNumbers = rsiValues.filter((v): v is number => v !== null)
    const emaOfRsi = computeEma(rsiNumbers, EMA_PERIOD)
    const wmaOfRsi = computeWma(rsiNumbers, WMA_PERIOD)

    emaRef.current?.setData(
      rsiData
        .map((d, i) => emaOfRsi[i] !== null ? { time: d.time, value: emaOfRsi[i]! } : null)
        .filter((d): d is { time: Time; value: number } => d !== null)
    )

    wmaRef.current?.setData(
      rsiData
        .map((d, i) => wmaOfRsi[i] !== null ? { time: d.time, value: wmaOfRsi[i]! } : null)
        .filter((d): d is { time: Time; value: number } => d !== null)
    )

    obRef.current?.setData(klines.map((k) => ({ time: k.time as Time, value: overbought })))
    osRef.current?.setData(klines.map((k) => ({ time: k.time as Time, value: oversold })))
    ob80Ref.current?.setData(klines.map((k) => ({ time: k.time as Time, value: 80 })))
    os20Ref.current?.setData(klines.map((k) => ({ time: k.time as Time, value: 20 })))
  }, [klines, period, overbought, oversold])

  // Live candle update
  useEffect(() => {
    if (!rsiRef.current || !liveCandle || !klines.length) return

    const closes = [...klines.slice(-(period * 3 + WMA_PERIOD)).map((k) => k.close), liveCandle.close]
    const rsiValues = computeRsi(closes, period)
    const rsiNumbers = rsiValues.filter((v): v is number => v !== null)
    const lastRsi = rsiNumbers[rsiNumbers.length - 1]
    if (lastRsi === undefined) return

    rsiRef.current.update({ time: liveCandle.time as Time, value: lastRsi })

    const emaOfRsi = computeEma(rsiNumbers, EMA_PERIOD)
    const wmaOfRsi = computeWma(rsiNumbers, WMA_PERIOD)
    const lastEma = emaOfRsi[emaOfRsi.length - 1]
    const lastWma = wmaOfRsi[wmaOfRsi.length - 1]
    if (lastEma !== null) emaRef.current?.update({ time: liveCandle.time as Time, value: lastEma })
    if (lastWma !== null) wmaRef.current?.update({ time: liveCandle.time as Time, value: lastWma })

    obRef.current?.update({ time: liveCandle.time as Time, value: overbought })
    osRef.current?.update({ time: liveCandle.time as Time, value: oversold })
    ob80Ref.current?.update({ time: liveCandle.time as Time, value: 80 })
    os20Ref.current?.update({ time: liveCandle.time as Time, value: 20 })
  }, [liveCandle]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync time scale from main chart
  useEffect(() => {
    if (!chartRef.current || !syncRange) return
    chartRef.current.timeScale().setVisibleLogicalRange(syncRange)
  }, [syncRange])

  return (
    <div className="relative flex-1 min-h-0 min-w-0">
      <span className="absolute top-1 left-2 text-[10px] text-slate-500 z-10 pointer-events-none select-none">
        RSI({period}){hoverValues.rsi !== null && <span className="ml-0.5">{hoverValues.rsi.toFixed(2)}</span>}
        <span className="text-yellow-400 ml-1">EMA{EMA_PERIOD}{hoverValues.ema !== null && <span className="ml-0.5">{hoverValues.ema.toFixed(2)}</span>}</span>
        <span className="text-red-400 ml-1">WMA{WMA_PERIOD}{hoverValues.wma !== null && <span className="ml-0.5">{hoverValues.wma.toFixed(2)}</span>}</span>
      </span>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
