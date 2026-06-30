import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrawingToolbar } from '../DrawingToolbar'
import { useAppStore } from '@/store'

beforeEach(() => {
  useAppStore.setState({ activeTool: 'cursor', activeColor: '#ffffff', activeWidth: 1 })
})

describe('DrawingToolbar', () => {
  it('renders 6 tool buttons', () => {
    render(<DrawingToolbar />)
    expect(screen.getAllByRole('button')).toHaveLength(6)
  })

  it('clicking a tool button activates that tool', async () => {
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByTitle('Horizontal Ray'))
    expect(useAppStore.getState().activeTool).toBe('horizontal_ray')
  })

  it('clicking the Cursor button resets to cursor', async () => {
    useAppStore.setState({ activeTool: 'fibonacci' })
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByTitle('Cursor'))
    expect(useAppStore.getState().activeTool).toBe('cursor')
  })
})

describe('DrawingToolbar color and width', () => {
  it('shows color swatches when horizontal_ray tool is active', () => {
    useAppStore.setState({ activeTool: 'horizontal_ray' })
    render(<DrawingToolbar />)
    expect(screen.getByRole('group', { name: /color/i })).toBeInTheDocument()
  })

  it('does not show color swatches when cursor is active', () => {
    render(<DrawingToolbar />)
    expect(screen.queryByRole('group', { name: /color/i })).not.toBeInTheDocument()
  })

  it('shows width picker when horizontal_ray tool is active', () => {
    useAppStore.setState({ activeTool: 'horizontal_ray' })
    render(<DrawingToolbar />)
    expect(screen.getByRole('group', { name: /width/i })).toBeInTheDocument()
  })

  it('clicking a color swatch updates activeColor in the store', async () => {
    useAppStore.setState({ activeTool: 'horizontal_ray' })
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByTitle('#ef4444'))
    expect(useAppStore.getState().activeColor).toBe('#ef4444')
  })

  it('clicking a width option updates activeWidth in the store', async () => {
    useAppStore.setState({ activeTool: 'horizontal_ray' })
    render(<DrawingToolbar />)
    await userEvent.click(screen.getByTitle('Width 2'))
    expect(useAppStore.getState().activeWidth).toBe(2)
  })
})
