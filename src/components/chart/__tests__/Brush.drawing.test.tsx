import { render, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { useAppStore } from '@/store'

// Same LWC mock as ChartPanel.drawing.test.tsx, with coordinateToTime added
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

// Stub ResizeObserver
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

describe('Brush drawing tool', () => {
  it('Behavior 1: mousedown + mousemove + mouseup in brush mode commits a Drawing with type brush and multiple points', () => {
    useAppStore.setState({
      activeTool: 'brush',
      activeSymbol: 'BTCUSDT',
      activeColor: '#ff0000',
      activeWidth: 2,
    })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!

    fireEvent.pointerDown(overlay, { offsetX: 10, offsetY: 20 })
    fireEvent.pointerMove(overlay, { offsetX: 20, offsetY: 30 })
    fireEvent.pointerMove(overlay, { offsetX: 30, offsetY: 40 })
    fireEvent.pointerUp(overlay)

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    expect(drawings).toHaveLength(1)
    expect(drawings[0]).toMatchObject({
      type: 'brush',
      color: '#ff0000',
      width: 2,
    })
    expect(drawings[0].points.length).toBeGreaterThanOrEqual(2)
  })

  it('Behavior 2: mousedown then immediate mouseup (no mousemove) does NOT commit a drawing', () => {
    useAppStore.setState({
      activeTool: 'brush',
      activeSymbol: 'BTCUSDT',
    })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!

    fireEvent.pointerDown(overlay, { offsetX: 10, offsetY: 20 })
    fireEvent.pointerUp(overlay)

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    expect(drawings).toHaveLength(0)
  })

  it('Behavior 3: after a brush stroke is committed, activeTool resets to cursor', () => {
    useAppStore.setState({
      activeTool: 'brush',
      activeSymbol: 'BTCUSDT',
    })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!

    fireEvent.pointerDown(overlay, { offsetX: 10, offsetY: 20 })
    fireEvent.pointerMove(overlay, { offsetX: 20, offsetY: 30 })
    fireEvent.pointerMove(overlay, { offsetX: 30, offsetY: 40 })
    fireEvent.pointerUp(overlay)

    expect(useAppStore.getState().activeTool).toBe('cursor')
  })
})
