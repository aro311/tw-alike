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
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800">
      {INTERVALS.map(({ value: iv, label }) => (
        <button
          key={iv}
          onClick={() => onChange(iv)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            value === iv
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {label}
        </button>
      ))}
      {rightSlot && (
        <>
          <div className="w-px h-4 bg-slate-700 mx-1 shrink-0" />
          {rightSlot}
        </>
      )}
    </div>
  )
}
