import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import type { Kline, VwapAnchor } from '@/types'
import { computeVwap, computeVwapLive } from '@/lib/vwap'

interface Props {
  klines: Kline[]
  liveCandle: Kline | null
  loading: boolean
  onChartReady?: (chart: IChartApi) => void
  vwapEnabled: boolean
  vwapAnchor: VwapAnchor
}

export function ChartPanel({ klines, liveCandle, loading, onChartReady, vwapEnabled, vwapAnchor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null)
  const vwapRef = useRef<ISeriesApi<'Line', Time> | null>(null)

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
      color: '#2962FF',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    chartRef.current = chart
    seriesRef.current = series
    vwapRef.current = vwap
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
    if (!vwapRef.current || !vwapEnabled || !klines.length) return
    const value = computeVwapLive(klines, liveCandle, vwapAnchor)
    if (value !== null) vwapRef.current.update({ time: liveCandle.time as Time, value })
  }, [liveCandle]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex-1 min-w-0 min-h-0">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0f1117]/80">
          <span className="text-slate-400 text-sm">Loading chart…</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
