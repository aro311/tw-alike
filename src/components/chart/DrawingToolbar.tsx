import { MousePointer2, Minus, TrendingUp, AlignJustify, CalendarRange, Pencil } from 'lucide-react'
import type { DrawingTool } from '@/types'
import { useAppStore } from '@/store'

const TOOLS: { tool: DrawingTool; title: string; icon: React.ReactNode }[] = [
  { tool: 'cursor',         title: 'Cursor',        icon: <MousePointer2 size={16} /> },
  { tool: 'horizontal_ray', title: 'Horizontal Ray', icon: <Minus size={16} /> },
  { tool: 'fibonacci',      title: 'Fibonacci',      icon: <TrendingUp size={16} /> },
  { tool: 'price_range',    title: 'Price Range',    icon: <AlignJustify size={16} /> },
  { tool: 'date_range',     title: 'Date Range',     icon: <CalendarRange size={16} /> },
  { tool: 'brush',          title: 'Brush',          icon: <Pencil size={16} /> },
]

const COLORS = ['#ffffff', '#ef4444', '#22c55e', '#f59e0b', '#06b6d4', '#3b82f6', '#a855f7', '#6b7280']
const WIDTHS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: '─' },
  { value: 2, label: '━' },
  { value: 3, label: '▬' },
]

export function DrawingToolbar() {
  const activeTool = useAppStore((s) => s.activeTool)
  const setActiveTool = useAppStore((s) => s.setActiveTool)
  const activeColor = useAppStore((s) => s.activeColor)
  const setActiveColor = useAppStore((s) => s.setActiveColor)
  const activeWidth = useAppStore((s) => s.activeWidth)
  const setActiveWidth = useAppStore((s) => s.setActiveWidth)

  const showStylePicker = activeTool !== 'cursor'

  return (
    <div className="flex flex-col items-center gap-1 w-9 py-2 bg-[#0f1117] border-r border-[#1e2433] z-20">
      {TOOLS.map(({ tool, title, icon }) => (
        <button
          key={tool}
          title={title}
          onClick={() => setActiveTool(tool)}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            activeTool === tool
              ? 'bg-slate-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {icon}
        </button>
      ))}

      {showStylePicker && (
        <>
          <div className="w-full h-px bg-[#1e2433] my-1" />

          <div role="group" aria-label="Color" className="flex flex-col items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color}
                title={color}
                onClick={() => setActiveColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  activeColor === color ? 'border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-full h-px bg-[#1e2433] my-1" />

          <div role="group" aria-label="Width" className="flex flex-col items-center gap-1">
            {WIDTHS.map(({ value, label }) => (
              <button
                key={value}
                title={`Width ${value}`}
                onClick={() => setActiveWidth(value)}
                className={`w-7 h-5 flex items-center justify-center text-xs rounded transition-colors ${
                  activeWidth === value
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
