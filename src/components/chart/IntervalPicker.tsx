import type { Interval } from '@/types'

const INTERVALS: Interval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w']

interface Props {
  value: Interval
  onChange: (interval: Interval) => void
}

export function IntervalPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 px-3 py-2 border-b border-slate-800">
      {INTERVALS.map((interval) => (
        <button
          key={interval}
          onClick={() => onChange(interval)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            value === interval
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          {interval}
        </button>
      ))}
    </div>
  )
}
