interface Props {
  enabled: boolean
  onToggle: () => void
}

export function VolumeToggle({ enabled, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        enabled
          ? 'text-[#FF9800] bg-[#FF9800]/10 border border-[#FF9800]/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
      title="Volume"
    >
      VOL
    </button>
  )
}
