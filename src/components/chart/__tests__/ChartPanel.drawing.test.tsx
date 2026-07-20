import { render, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('ChartPanel drawing overlay', () => {
  const defaultProps = {
    klines: [],
    liveCandle: null,
    loading: false,
    vwapEnabled: false,
    vwapAnchor: 'W' as const,
    blEnabled: false,
    blSlowEnabled: false,
  }

  it('overlay is pointer-events-none when activeTool is cursor', () => {
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')
    expect(overlay).toHaveClass('pointer-events-none')
  })

  it('overlay captures pointer events when a drawing tool is active', () => {
    useAppStore.setState({ activeTool: 'horizontal_ray' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')
    expect(overlay).toHaveClass('pointer-events-auto')
  })

  it('single click (mouseDown) in horizontal_ray mode commits a Drawing immediately', () => {
    useAppStore.setState({
      activeTool: 'horizontal_ray',
      activeSymbol: 'BTCUSDT',
      activeColor: '#ef4444',
      activeWidth: 2,
    })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 50, offsetY: 100 })
    fireEvent.pointerUp(overlay, { offsetX: 50, offsetY: 100 })
    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    expect(drawings).toHaveLength(1)
    expect(drawings[0]).toMatchObject({
      type: 'horizontal_ray',
      color: '#ef4444',
      width: 2,
      points: [{ time: 1000000, value: 50000 }],
    })
  })

  it('horizontal_ray mouseDown commits and resets activeTool to cursor', () => {
    useAppStore.setState({ activeTool: 'horizontal_ray', activeSymbol: 'BTCUSDT' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 50, offsetY: 100 })
    fireEvent.pointerUp(overlay, { offsetX: 50, offsetY: 100 })
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(1)
    expect(useAppStore.getState().activeTool).toBe('cursor')
  })

  it('Escape during price_range drag cancels without committing', async () => {
    useAppStore.setState({ activeTool: 'price_range', activeSymbol: 'BTCUSDT' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 50, offsetY: 100 })
    await userEvent.keyboard('{Escape}')
    expect(useAppStore.getState().activeTool).toBe('price_range')
    fireEvent.pointerUp(overlay, { offsetX: 200, offsetY: 100 })
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(0)
  })

  it('activeTool resets to cursor after a successful horizontal_ray commit', () => {
    useAppStore.setState({ activeTool: 'horizontal_ray', activeSymbol: 'BTCUSDT' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 50, offsetY: 100 })
    fireEvent.pointerUp(overlay, { offsetX: 50, offsetY: 100 })
    expect(useAppStore.getState().activeTool).toBe('cursor')
  })

  it('price_range activeTool stays unchanged when drag is below threshold', () => {
    useAppStore.setState({ activeTool: 'price_range', activeSymbol: 'BTCUSDT' })
    const { container } = render(<ChartPanel {...defaultProps} />)
    const overlay = container.querySelector('[data-drawing-overlay]')!
    fireEvent.pointerDown(overlay, { offsetX: 50, offsetY: 100 })
    fireEvent.pointerUp(overlay, { offsetX: 52, offsetY: 101 })
    expect(useAppStore.getState().activeTool).toBe('price_range')
  })

  it('Delete key removes the selected Drawing', async () => {
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: 'draw-1',
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.setState({ selectedDrawingId: 'draw-1' })
    render(<ChartPanel {...defaultProps} />)
    await userEvent.keyboard('{Delete}')
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(0)
  })
})
