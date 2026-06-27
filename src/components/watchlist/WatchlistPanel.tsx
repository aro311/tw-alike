import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '@/store'
import type { Ticker, WatchlistEntry } from '@/types'
import { Badge } from '@/components/ui/badge'
import { AddSymbolModal } from './AddSymbolModal'

interface ItemProps {
  entry: WatchlistEntry
  ticker: Ticker | undefined
  dailyOpen: number | undefined
  isActive: boolean
  isIconMode: boolean
  onSelect: (symbol: string) => void
  onRemove: (symbol: string) => void
}

function SortableWatchlistItem({ entry, ticker, dailyOpen, isActive, isIconMode, onSelect, onRemove }: ItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.symbol,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const change = ticker && dailyOpen
    ? (parseFloat(ticker.price) - dailyOpen) / dailyOpen * 100
    : null
  const isPositive = change !== null && change >= 0
  const base = entry.symbol.replace('USDT', '')

  if (isIconMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="relative group"
        {...attributes}
        {...listeners}
      >
        <button
          onClick={() => onSelect(entry.symbol)}
          className={`w-full flex items-center justify-center py-3 text-xs font-bold transition-colors cursor-grab active:cursor-grabbing ${
            isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
          title={entry.symbol}
        >
          {base.slice(0, 3)}
        </button>
        <button
          onClick={() => onRemove(entry.symbol)}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 text-xs leading-none w-4 h-4 flex items-center justify-center rounded transition-opacity"
          title={`Remove ${entry.symbol}`}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-stretch border-b border-slate-800/50 ${
        isActive ? 'bg-slate-800' : 'hover:bg-slate-800/50'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center px-1.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="Drag to reorder"
      >
        ⠿
      </div>

      {/* Main clickable area */}
      <button
        onClick={() => onSelect(entry.symbol)}
        className="flex flex-col flex-1 min-w-0 px-2 py-2.5 text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm font-medium text-white truncate">{base}</span>
            {entry.market === 'futures' && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-1 py-0.5 rounded shrink-0">PERP</span>
            )}
          </div>
          {change !== null && (
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0 border-0 shrink-0 ml-1 ${
                isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
              }`}
            >
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </Badge>
          )}
        </div>
        {ticker && (
          <span className="text-xs text-slate-400 mt-0.5">
            ${parseFloat(ticker.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(entry.symbol)}
        className="opacity-0 group-hover:opacity-100 flex items-center px-2 text-slate-500 hover:text-red-400 text-sm transition-opacity shrink-0"
        title={`Remove ${entry.symbol}`}
      >
        ×
      </button>
    </div>
  )
}

interface Props {
  tickers: Record<string, Ticker>
  dailyOpens: Record<string, number>
}

export function WatchlistPanel({ tickers, dailyOpens }: Props) {
  const { watchlist, activeSymbol, watchlistPanelMode, setActiveSymbol, setWatchlistPanelMode, removeFromWatchlist, reorderWatchlist } =
    useAppStore()
  const [modalOpen, setModalOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = watchlist.findIndex((e) => e.symbol === String(active.id))
    const toIndex = watchlist.findIndex((e) => e.symbol === String(over.id))
    if (fromIndex !== -1 && toIndex !== -1) reorderWatchlist(fromIndex, toIndex)
  }

  if (watchlistPanelMode === 'hidden') return null
  const isIconMode = watchlistPanelMode === 'icons'

  return (
    <>
      <div
        className={`flex flex-col border-l border-slate-800 bg-[#0f1117] transition-all ${
          isIconMode ? 'w-14' : 'w-52'
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 shrink-0">
          {!isIconMode && (
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Watchlist
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setModalOpen(true)}
              className="text-slate-500 hover:text-white text-sm px-1 leading-none"
              title="Add symbol"
            >
              +
            </button>
            <button
              onClick={() => setWatchlistPanelMode(isIconMode ? 'list' : 'icons')}
              className="text-slate-500 hover:text-white text-xs px-1"
              title={isIconMode ? 'Expand' : 'Collapse'}
            >
              {isIconMode ? '»' : '«'}
            </button>
          </div>
        </div>

        {/* Sortable symbol list */}
        <div className="flex-1 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={watchlist.map((e) => e.symbol)}
              strategy={verticalListSortingStrategy}
            >
              {watchlist.map((entry) => (
                <SortableWatchlistItem
                  key={entry.symbol}
                  entry={entry}
                  ticker={tickers[entry.symbol]}
                  dailyOpen={dailyOpens[entry.symbol]}
                  isActive={entry.symbol === activeSymbol}
                  isIconMode={isIconMode}
                  onSelect={setActiveSymbol}
                  onRemove={removeFromWatchlist}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {modalOpen && <AddSymbolModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
