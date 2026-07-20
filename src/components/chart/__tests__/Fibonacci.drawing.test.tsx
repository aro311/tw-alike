import { render, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'

vi.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: vi.fn(),
      update: vi.fn(),
      attachPrimitive: vi.fn(),
      detachPrimitive: vi.fn(),
      coordinateToPrice: vi.fn(() => 50000),
      priceToCoordinate: vi.fn(() => 100),
      priceScale: () => ({ applyOptions: vi.fn() }),
    }),
    applyOptions: vi.fn(),
    timeScale: () => ({
      fitContent: vi.fn(),
      width: vi.fn(() => 800),
      coordinateToTime: vi.fn(() => 1000000),
    }),
    subscribeClick: vi.fn(),
    subscribeCrosshairMove: vi.fn(),
    subscribeDblClick: vi.fn(),
    remove: vi.fn(),
    paneSize: () => ({ width: 800 }),
  }),
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

beforeEach(() => {
  useAppStore.setState({
    activeTool: 'cursor',
    activeColor: '#ffffff',
    activeWidth: 1,
    selectedDrawingId: null,
    lastPlacedDrawing: null,
    symbolSettings: {},
  })
})

const defaultProps = {
  klines: [],
  liveCandle: null,
  loading: false,
  vwapEnabled: false,
  vwapAnchor: 'W' as const,
  blEnabled: false,
  blSlowEnabled: false,
}

describe('Fibonacci drawing tool', () => {
  it('Behavior 1: drag ≥4px commits a fibonacci Drawing with two points', () => {
    useAppStore.setState({
      activeTool: 'fibonacci',
      activeSymbol: 'BTCUSDT',
      activeColor: '#ffcc00',
      activeWidth: 2,
    })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 100, offsetY: 80 })
    fireEvent.pointerUp(overlay, { offsetX: 100, offsetY: 80 })
    fireEvent.pointerDown(overlay, { offsetX: 100, offsetY: 160 })
    fireEvent.pointerUp(overlay, { offsetX: 100, offsetY: 160 })
    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    expect(drawings).toHaveLength(1)
    expect(drawings[0]).toMatchObject({
      type: 'fibonacci',
      color: '#ffcc00',
      width: 2,
      points: [
        { time: 1000000, value: 50000 },
        { time: 1000000, value: 50000 },
      ],
    })
    expect(drawings[0].id).toBeDefined()
  })

  it('Behavior 2: drag below 4px threshold commits nothing', () => {
    useAppStore.setState({ activeTool: 'fibonacci', activeSymbol: 'BTCUSDT' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 100, offsetY: 100 })
    fireEvent.pointerUp(overlay, { offsetX: 102, offsetY: 101 })
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(0)
  })
})
