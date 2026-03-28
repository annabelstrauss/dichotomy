export default function StatusBadge({ variant = 'live', label }) {
  const styles = {
    live: 'bg-[#CCFBF1] text-[#0F766E]',
    revealed: 'bg-[#DCFCE7] text-[#166534]',
  }
  const dotColor = {
    live: '#0D9488',
    revealed: '#16A34A',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-semibold ${styles[variant]}`}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor[variant] }} />
      {label ?? (variant === 'live' ? 'Live' : 'Revealed')}
    </span>
  )
}
