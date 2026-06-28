import { useState, useRef, useEffect } from 'react'
import type { VwapAnchor } from '@/types'

const ANCHORS: { value: VwapAnchor; label: string }[] = [
  { value: 'D',   label: 'D'   },
  { value: 'W',   label: 'W'   },
  { value: 'M',   label: 'M'   },
  { value: '12M', label: '12M' },
]

interface Props {
  enabled: boolean
  anchor: VwapAnchor
  onToggle: () => void
  onAnchorChange: (anchor: VwapAnchor) => void
}

export function VwapSelector({ enabled, anchor, onToggle, onAnchorChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          enabled
            ? 'text-[#2962FF] bg-[#2962FF]/10 border border-[#2962FF]/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        VWAP{enabled ? `·${anchor}` : ''}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-[#1a1f2e] border border-slate-700 rounded shadow-xl z-50 min-w-[72px] py-1">
          {ANCHORS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                if (!enabled) onToggle()
                onAnchorChange(value)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-700 ${
                enabled && anchor === value ? 'text-[#2962FF]' : 'text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
          {enabled && (
            <button
              onClick={() => { onToggle(); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-700 hover:text-slate-300 border-t border-slate-700 transition-colors mt-1 pt-1"
            >
              Off
            </button>
          )}
        </div>
      )}
    </div>
  )
}
