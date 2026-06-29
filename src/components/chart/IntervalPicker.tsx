import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Interval } from '@/types'

const INTERVALS: { value: Interval; label: string }[] = [
  { value: '5m',  label: '5m'  },
  { value: '15m', label: '15m' },
  { value: '1h',  label: '1H'  },
  { value: '2h',  label: '2H'  },
  { value: '4h',  label: '4H'  },
  { value: '12h', label: '12H' },
  { value: '1d',  label: '1D'  },
  { value: '3d',  label: '3D'  },
  { value: '1w',  label: 'W'   },
  { value: '1M',  label: 'M'   },
]

interface Props {
  value: Interval
  onChange: (interval: Interval) => void
  rightSlot?: ReactNode
}

export function IntervalPicker({ value, onChange, rightSlot }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeLabel = INTERVALS.find((i) => i.value === value)?.label ?? value

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="px-2.5 py-1 rounded text-xs font-medium transition-colors text-[#2962FF] bg-[#2962FF]/10 border border-[#2962FF]/30"
        >
          {activeLabel}
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 bg-[#1a1f2e] border border-slate-700 rounded shadow-xl z-50 min-w-[72px] py-1">
            {INTERVALS.map(({ value: iv, label }) => (
              <button
                key={iv}
                onClick={() => { onChange(iv); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium transition-colors hover:bg-slate-700 ${
                  value === iv ? 'text-[#2962FF]' : 'text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {rightSlot && (
        <>
          <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
          {rightSlot}
        </>
      )}
    </div>
  )
}
