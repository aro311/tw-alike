import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, CandlestickSeries } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import type { Kline } from '@/types'

interface Props {
  klines: Kline[]
  liveCandle: Kline | null
  loading: boolean
  onChartReady?: (chart: IChartApi) => void
}

export function ChartPanel({ klines, liveCandle, loading, onChartReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick', Time> | null>(null)

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
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    chartRef.current = chart
    seriesRef.current = series
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
  }, [liveCandle])

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
