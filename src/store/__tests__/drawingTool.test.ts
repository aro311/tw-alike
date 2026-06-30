import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../index'

// Test 1 — no reset, reads the store's true initial state
it('activeTool defaults to cursor', () => {
  expect(useAppStore.getState().activeTool).toBe('cursor')
})

describe('activeTool mutations', () => {
  beforeEach(() => {
    useAppStore.setState({ activeTool: 'cursor' })
  })

  it('setActiveTool updates the active tool', () => {
    useAppStore.getState().setActiveTool('fibonacci')
    expect(useAppStore.getState().activeTool).toBe('fibonacci')
  })

  it('setActiveSymbol resets activeTool to cursor', () => {
    useAppStore.getState().setActiveTool('brush')
    useAppStore.getState().setActiveSymbol('ETHUSDT')
    expect(useAppStore.getState().activeTool).toBe('cursor')
  })
})

describe('undoLastDrawing', () => {
  beforeEach(() => {
    useAppStore.setState({ symbolSettings: {}, lastPlacedDrawing: null })
  })

  it('removes the last placed Drawing from the active symbol', () => {
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: 'draw-1',
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.getState().undoLastDrawing()
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(0)
  })

  it('clears lastPlacedDrawingId after undo', () => {
    useAppStore.getState().addDrawing('BTCUSDT', {
      id: 'draw-1',
      type: 'horizontal_ray',
      points: [{ time: 0, value: 50000 }],
      color: '#ffffff',
      width: 1,
    })
    useAppStore.getState().undoLastDrawing()
    expect(useAppStore.getState().lastPlacedDrawing).toBeNull()
  })

  it('does nothing when there is no last placed Drawing', () => {
    useAppStore.getState().undoLastDrawing()
    expect(useAppStore.getState().getSymbolSettings('BTCUSDT').drawings).toHaveLength(0)
  })
})
