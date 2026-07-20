import { render, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'

// Unlike Fibonacci.drawing.test.tsx, coordinates here are formula-based (not constant)
// so that the two ControlPoints resolve to distinct, distinguishable screen positions —
// required to test that dragging one anchor doesn't affect the other.
vi.mock('lightweight-charts', () => ({
  createChart: () => {
    const series = {
      setData: vi.fn(),
      update: vi.fn(),
      attachPrimitive: (p: { attached: (param: unknown) => void }) =>
        p.attached({ series, chart, requestUpdate: vi.fn() }),
      detachPrimitive: vi.fn(),
      coordinateToPrice: (y: number) => 1000 - y,
      priceToCoordinate: (price: number) => 1000 - price,
      priceScale: () => ({ applyOptions: vi.fn() }),
    }
    const chart = {
      addSeries: () => series,
      applyOptions: vi.fn(),
      timeScale: () => ({
        fitContent: vi.fn(),
        width: vi.fn(() => 800),
        // LWC returns null when the x coordinate doesn't land on a real bar
        // (e.g. dragging past the edge of the loaded data range).
        coordinateToTime: (x: number) => (x > 700 ? null : x),
        timeToCoordinate: (t: number) => t,
      }),
      subscribeClick: vi.fn(),
      subscribeCrosshairMove: vi.fn(),
      subscribeDblClick: vi.fn(),
      remove: vi.fn(),
      paneSize: () => ({ width: 800 }),
    }
    return chart
  },
  CandlestickSeries: {},
  LineSeries: {},
  HistogramSeries: {},
  ColorType: { Solid: 'solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 1 },
}))

window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

import { ChartPanel } from '../ChartPanel'

const defaultProps = {
  klines: [],
  liveCandle: null,
  loading: false,
  vwapEnabled: false,
  vwapAnchor: 'W' as const,
  blEnabled: false,
  blSlowEnabled: false,
}

beforeEach(() => {
  useAppStore.setState({
    activeTool: 'cursor',
    activeColor: '#ffffff',
    activeWidth: 1,
    activeSymbol: 'BTCUSDT',
    selectedDrawingId: null,
    lastPlacedDrawing: null,
    symbolSettings: {},
  })
  useAppStore.getState().addDrawing('BTCUSDT', {
    id: 'fib1',
    type: 'fibonacci',
    color: '#ffffff',
    width: 1,
    points: [{ time: 100, value: 200 }, { time: 300, value: 100 }],
  })
  useAppStore.setState({ selectedDrawingId: 'fib1' })
})

describe('Fibonacci ControlPoint dragging', () => {
  it('dragging the ratio-1 ControlPoint (points[0]) repositions only points[0]', () => {
    const { container } = render(<ChartPanel {...defaultProps} />)
    // In cursor mode, ControlPoint dragging happens on the chart's own canvas container
    // (a sibling of the drawing overlay, which is pointer-events-none in cursor mode).
    const chartContainer = container.querySelector('[data-drawing-overlay]')!.nextElementSibling!

    // points[0] = { time: 100, value: 200 } → screen (x: 100, y: 1000 - 200 = 800)
    fireEvent.pointerDown(chartContainer, { offsetX: 100, offsetY: 800 })
    fireEvent.pointerMove(chartContainer, { offsetX: 120, offsetY: 760 })
    fireEvent.pointerUp(chartContainer, { offsetX: 120, offsetY: 760 })

    const drawing = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings[0]
    expect(drawing.points[0]).toEqual({ time: 120, value: 240 })
    expect(drawing.points[1]).toEqual({ time: 300, value: 100 })
  })

  it('dragging the ratio-0 ControlPoint (points[1]) repositions only points[1]', () => {
    const { container } = render(<ChartPanel {...defaultProps} />)
    const chartContainer = container.querySelector('[data-drawing-overlay]')!.nextElementSibling!

    // points[1] = { time: 300, value: 100 } → screen (x: 300, y: 1000 - 100 = 900)
    fireEvent.pointerDown(chartContainer, { offsetX: 300, offsetY: 900 })
    fireEvent.pointerMove(chartContainer, { offsetX: 280, offsetY: 950 })
    fireEvent.pointerUp(chartContainer, { offsetX: 280, offsetY: 950 })

    const drawing = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings[0]
    expect(drawing.points[1]).toEqual({ time: 280, value: 50 })
    expect(drawing.points[0]).toEqual({ time: 100, value: 200 })
  })

  it('does not snap the anchor to time 0 when coordinateToTime returns null mid-drag', () => {
    const { container } = render(<ChartPanel {...defaultProps} />)
    const chartContainer = container.querySelector('[data-drawing-overlay]')!.nextElementSibling!

    // points[0] = { time: 100, value: 200 } → screen (x: 100, y: 800)
    fireEvent.pointerDown(chartContainer, { offsetX: 100, offsetY: 800 })
    // Drag to x: 750, which is past the mocked "loaded data range" (coordinateToTime → null)
    fireEvent.pointerMove(chartContainer, { offsetX: 750, offsetY: 780 })
    fireEvent.pointerUp(chartContainer, { offsetX: 750, offsetY: 780 })

    const drawing = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings[0]
    expect(drawing.points[0].time).not.toBe(0)
    expect(drawing.points[0].time).toBe(100)
  })
})
