import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DrawingEditDialog } from '../DrawingEditDialog'
import type { Drawing } from '@/types'

const makeHorizontalRay = (price: number): Drawing => ({
  id: 'ray-1',
  type: 'horizontal_ray',
  points: [{ time: 0, value: price }],
  color: '#ffffff',
  width: 1,
})

const makeFibonacci = (p1: number, p2: number): Drawing => ({
  id: 'fib-1',
  type: 'fibonacci',
  points: [
    { time: 1000, value: p1 },
    { time: 2000, value: p2 },
  ],
  color: '#ffcc00',
  width: 1,
})

const makePriceRange = (p1: number, p2: number): Drawing => ({
  id: 'pr-1',
  type: 'price_range',
  points: [
    { time: 0, value: p1 },
    { time: 0, value: p2 },
  ],
  color: '#00ff00',
  width: 1,
})

describe('DrawingEditDialog — horizontal_ray', () => {
  it('shows "Price" input pre-filled with the point value', () => {
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Price') as HTMLInputElement
    expect(input.value).toBe('50000')
  })

  it('Ok click calls onConfirm with updated price', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Price')
    fireEvent.change(input, { target: { value: '55000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))
    expect(onConfirm).toHaveBeenCalledWith([{ time: 0, value: 55000 }])
  })

  it('Enter key calls onConfirm', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Price')
    fireEvent.change(input, { target: { value: '60000' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith([{ time: 0, value: 60000 }])
  })

  it('Cancel click calls onCancel', () => {
    const onCancel = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('Escape key calls onCancel', () => {
    const onCancel = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    const input = screen.getByLabelText('Price')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })

  it('title is "Horizontal Ray"', () => {
    render(
      <DrawingEditDialog
        drawing={makeHorizontalRay(50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Horizontal Ray')).toBeInTheDocument()
  })
})

describe('DrawingEditDialog — fibonacci', () => {
  it('shows "Fibonacci" as the title', () => {
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Fibonacci')).toBeInTheDocument()
  })

  it('"Point 1 price" input is pre-filled with points[0].value', () => {
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Point 1 price') as HTMLInputElement
    expect(input.value).toBe('60000')
  })

  it('"Point 2 price" input is pre-filled with points[1].value', () => {
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Point 2 price') as HTMLInputElement
    expect(input.value).toBe('50000')
  })

  it('Ok click calls onConfirm with both updated points', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.change(screen.getByLabelText('Point 2 price'), { target: { value: '45000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))
    expect(onConfirm).toHaveBeenCalledWith([
      { time: 1000, value: 65000 },
      { time: 2000, value: 45000 },
    ])
  })

  it('Enter on Point 1 input calls onConfirm with both points', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.keyDown(screen.getByLabelText('Point 1 price'), { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith([
      { time: 1000, value: 65000 },
      { time: 2000, value: 50000 },
    ])
  })

  it('Cancel click calls onCancel', () => {
    const onCancel = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makeFibonacci(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('DrawingEditDialog — price_range', () => {
  it('shows "Price Range" as the title', () => {
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('Price Range')).toBeInTheDocument()
  })

  it('"Point 1 price" input is pre-filled with points[0].value', () => {
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Point 1 price') as HTMLInputElement
    expect(input.value).toBe('60000')
  })

  it('"Point 2 price" input is pre-filled with points[1].value', () => {
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    const input = screen.getByLabelText('Point 2 price') as HTMLInputElement
    expect(input.value).toBe('50000')
  })

  it('Ok click calls onConfirm with both updated points', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.change(screen.getByLabelText('Point 2 price'), { target: { value: '45000' } })
    fireEvent.click(screen.getByRole('button', { name: /ok/i }))
    expect(onConfirm).toHaveBeenCalledWith([
      { time: 0, value: 65000 },
      { time: 0, value: 45000 },
    ])
  })

  it('Enter on Point 1 input calls onConfirm with both points', () => {
    const onConfirm = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Point 1 price'), { target: { value: '65000' } })
    fireEvent.keyDown(screen.getByLabelText('Point 1 price'), { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledWith([
      { time: 0, value: 65000 },
      { time: 0, value: 50000 },
    ])
  })

  it('Cancel click calls onCancel', () => {
    const onCancel = vi.fn()
    render(
      <DrawingEditDialog
        drawing={makePriceRange(60000, 50000)}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})
