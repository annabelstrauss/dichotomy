// Player avatar colors — assigned by join order index
export const PLAYER_COLORS = [
  '#FDBA74', // warm orange (You / first player)
  '#A5B4FC', // lavender
  '#6EE7B7', // mint
  '#FCA5A5', // rose
  '#93C5FD', // sky blue
  '#86EFAC', // green
  '#FCD34D', // yellow
  '#C4B5FD', // purple
]

export default function PlayerChip({ player, highlight, small = false }) {
  const avatarSize = small ? 'w-10 h-10' : 'w-14 h-14'
  const nameSize = small ? 'text-[10px]' : 'text-[11px]'

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: small ? 56 : 72 }}>
      <div
        className={`${avatarSize} rounded-full overflow-hidden flex-shrink-0`}
        style={{
          backgroundColor: player.color || '#E5E7EB',
          outline: highlight ? `3px solid ${player.color || '#E5E7EB'}` : '3px solid white',
          outlineOffset: '1px',
        }}
      >
        {player.avatar_url ? (
          <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {player.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span
        className={`${nameSize} font-semibold text-ink text-center leading-tight`}
        style={{ maxWidth: small ? 56 : 68 }}
      >
        {player.name}
      </span>
    </div>
  )
}
