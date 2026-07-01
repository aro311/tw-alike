import { useEffect, useRef, useState } from 'react'
import type { Drawing } from '@/types'

interface Props {
  drawing: Drawing
  onConfirm: (points: { time: number; value: number }[]) => void
  onCancel: () => void
}

export function DrawingEditDialog({ drawing, onConfirm, onCancel }: Props) {
  const isTwoPoint = drawing.type === 'fibonacci' || drawing.type === 'price_range'
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [price, setPrice] = useState(String(+(drawing.points[0]?.value ?? 0).toFixed(2)))
  const [price2, setPrice2] = useState(String(+(drawing.points[1]?.value ?? 0).toFixed(2)))

  const title =
    drawing.type === 'fibonacci' ? 'Fibonacci' :
    drawing.type === 'price_range' ? 'Price Range' :
    'Horizontal Ray'

  useEffect(() => {
    firstInputRef.current?.focus()
    firstInputRef.current?.select()
  }, [])

  const handleConfirm = () => {
    if (isTwoPoint) {
      onConfirm([
        { time: drawing.points[0].time, value: parseFloat(price) },
        { time: drawing.points[1].time, value: parseFloat(price2) },
      ])
    } else {
      onConfirm([{ time: drawing.points[0].time, value: parseFloat(price) }])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Card */}
      <div
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className="relative z-10 w-72 rounded-lg border border-slate-700 bg-[#1e2433] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">
          {isTwoPoint ? (
            <>
              <PriceField
                label="Point 1 price"
                value={price}
                onChange={setPrice}
                onKeyDown={handleKeyDown}
                ref={firstInputRef}
              />
              <PriceField
                label="Point 2 price"
                value={price2}
                onChange={setPrice2}
                onKeyDown={handleKeyDown}
              />
            </>
          ) : (
            <PriceField
              label="Price"
              value={price}
              onChange={setPrice}
              onKeyDown={handleKeyDown}
              ref={firstInputRef}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-700 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  )
}

interface PriceFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  ref?: React.Ref<HTMLInputElement>
}

function PriceField({ label, value, onChange, onKeyDown, ref }: PriceFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{label}</label>
      <input
        ref={ref}
        aria-label={label}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="rounded border border-slate-600 bg-[#0f1117] px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </div>
  )
}
