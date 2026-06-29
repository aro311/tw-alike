interface Props {
  enabled: boolean
  slowEnabled: boolean
  onToggle: () => void
  onSlowToggle: () => void
}

export function BaselineToggle({ enabled, slowEnabled, onToggle, onSlowToggle }: Props) {
  const anyOn = enabled || slowEnabled

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onToggle}
        className={`px-2.5 py-1 rounded-l text-xs font-medium transition-colors ${
          enabled
            ? 'text-[#FFD700] bg-[#FFD700]/10 border border-[#FFD700]/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Baseline (fast)"
      >
        BL 70
      </button>
      <button
        onClick={onSlowToggle}
        className={`px-2 py-1 rounded-r text-xs font-medium transition-colors ${
          slowEnabled
            ? 'text-[#9C27B0] bg-[#9C27B0]/10 border border-[#9C27B0]/30'
            : anyOn
              ? 'text-slate-500 hover:text-white hover:bg-slate-800 border-l border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Slow Baseline"
      >
        BL 200
      </button>
    </div>
  )
}
