import { render, screen, fireEvent, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '@/store'

// Capture the subscribeDblClick callback so we can trigger it in tests
let dblClickHandler: ((param: { point?: { x: number; y: number }; hoveredObjectId?: string }) => void) | null = null

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
    subscribeDblClick: vi.fn((cb) => { dblClickHandler = cb }),
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
  dblClickHandler = null
  useAppStore.setState({
    activeTool: 'cursor',
    activeColor: '#ffffff',
    activeWidth: 1,
    selectedDrawingId: null,
    lastPlacedDrawing: null,
    symbolSettings: {},
  })
})

describe('DrawingEditDialog integration — horizontal_ray', () => {
  it('double-clicking a horizontal_ray drawing in cursor mode opens the dialog', async () => {
    const drawingId = 'ray-1'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)
    expect(dblClickHandler).not.toBeNull()

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    expect(screen.getByText('Horizontal Ray')).toBeInTheDocument()
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
  })

  it('confirming a horizontal_ray edit updates the drawing price in the store', async () => {
    const drawingId = 'ray-2'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    const input = screen.getByLabelText('Price')
    fireEvent.change(input, { target: { value: '60000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    const updated = drawings.find((d) => d.id === drawingId)
    expect(updated?.points[0].value).toBe(60000)
  })

  it('cancelling closes the dialog without updating the store', async () => {
    const drawingId = 'ray-3'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    expect(screen.getByText('Horizontal Ray')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Horizontal Ray')).not.toBeInTheDocument()

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    expect(drawings.find((d) => d.id === drawingId)?.points[0].value).toBe(50000)
  })

  it('double-clicking does nothing when activeTool is not cursor', async () => {
    const drawingId = 'ray-4'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'horizontal_ray' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    expect(screen.queryByText('Horizontal Ray')).not.toBeInTheDocument()
  })

  it('double-clicking nowhere (no hoveredObjectId) does not open the dialog', async () => {
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })
    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({})
    })

    expect(screen.queryByText('Horizontal Ray')).not.toBeInTheDocument()
  })
})

describe('DrawingEditDialog integration — fibonacci', () => {
  it('double-clicking a fibonacci drawing in cursor mode opens the dialog', async () => {
    const drawingId = 'fib-1'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'fibonacci',
      points: [{ time: 1000, value: 60000 }, { time: 2000, value: 50000 }],
      color: '#ffcc00',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    expect(screen.getByText('Fibonacci')).toBeInTheDocument()
    expect(screen.getByLabelText('Point 1 price')).toBeInTheDocument()
    expect(screen.getByLabelText('Point 2 price')).toBeInTheDocument()
  })

  it('confirming a fibonacci edit updates both points in the store', async () => {
    const drawingId = 'fib-2'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'fibonacci',
      points: [{ time: 1000, value: 60000 }, { time: 2000, value: 50000 }],
      color: '#ffcc00',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.change(screen.getByLabelText('Point 2 price'), { target: { value: '45000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    const updated = drawings.find((d) => d.id === drawingId)
    expect(updated?.points[0].value).toBe(65000)
    expect(updated?.points[1].value).toBe(45000)
  })
})

describe('DrawingEditDialog integration — price_range', () => {
  it('double-clicking a price_range drawing in cursor mode opens the dialog', async () => {
    const drawingId = 'pr-1'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'price_range',
      points: [{ time: 0, value: 60000 }, { time: 0, value: 50000 }],
      color: '#00ff00',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)
    expect(dblClickHandler).not.toBeNull()

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    expect(screen.getByText('Price Range')).toBeInTheDocument()
    expect(screen.getByLabelText('Point 1 price')).toBeInTheDocument()
    expect(screen.getByLabelText('Point 2 price')).toBeInTheDocument()
  })

  it('confirming a price_range edit updates both points[0].value and points[1].value in the store', async () => {
    const drawingId = 'pr-2'
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: drawingId,
      type: 'price_range',
      points: [{ time: 0, value: 60000 }, { time: 0, value: 50000 }],
      color: '#00ff00',
      width: 1,
    })
    useAppStore.setState({ activeSymbol: 'BTCUSDT', activeTool: 'cursor' })

    render(<ChartPanel {...defaultProps} />)

    await act(async () => {
      dblClickHandler!({ hoveredObjectId: drawingId })
    })

    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.change(screen.getByLabelText('Point 2 price'), { target: { value: '45000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))

    const drawings = useAppStore.getState().getSymbolSettings('BTCUSDT').drawings
    const updated = drawings.find((d) => d.id === drawingId)
    expect(updated?.points[0].value).toBe(65000)
    expect(updated?.points[1].value).toBe(45000)
  })
})
