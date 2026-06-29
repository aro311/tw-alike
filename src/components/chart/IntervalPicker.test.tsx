import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IntervalPicker } from './IntervalPicker'

describe('IntervalPicker', () => {
  it('shows the active interval as the trigger label', () => {
    render(<IntervalPicker value="15m" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument()
  })

  it('does not show other interval options before the dropdown is opened', () => {
    render(<IntervalPicker value="15m" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '1H' })).not.toBeInTheDocument()
  })

  it('shows all interval options after clicking the trigger', () => {
    render(<IntervalPicker value="15m" onChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '15m' }))
    expect(screen.getByRole('button', { name: '1H' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '4H' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument()
  })

  it('calls onChange with the selected interval and closes the dropdown', () => {
    const onChange = vi.fn()
    render(<IntervalPicker value="15m" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: '15m' }))
    fireEvent.click(screen.getByRole('button', { name: '4H' }))
    expect(onChange).toHaveBeenCalledWith('4h')
    expect(screen.queryByRole('button', { name: '1H' })).not.toBeInTheDocument()
  })

  it('renders the rightSlot alongside the trigger', () => {
    render(
      <IntervalPicker value="15m" onChange={vi.fn()} rightSlot={<span>VWAP</span>} />
    )
    expect(screen.getByText('VWAP')).toBeInTheDocument()
  })
})
