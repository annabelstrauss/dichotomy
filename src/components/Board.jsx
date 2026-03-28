import { useDroppable, useDraggable } from '@dnd-kit/core'

export default function Board({ game, players, placements, showRevealed, myPlayerId }) {
  const { setNodeRef } = useDroppable({ id: 'board' })

  function toPercent(x, y) {
    return {
      left: `${((x + 1) / 2) * 100}%`,
      top: `${((1 - y) / 2) * 100}%`,
    }
  }

  const label =
    'absolute text-[11px] font-extrabold tracking-[1.2px] text-ink uppercase pointer-events-none leading-tight'

  return (
    <div
      id="board-container"
      ref={setNodeRef}
      className="relative w-full h-full touch-none"
    >
      {/* Equal-length axes: square centered in board; x spans full square width, y matches that length */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="relative aspect-square w-full max-h-full shrink-0">
          <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-board-line -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-board-line -translate-x-1/2" />
          {/* Top/bottom: anchor at line ends, translate off-axis so text never overlaps the vertical bar */}
          <span
            className={`${label} top-0 left-1/2 max-w-[85%] -translate-x-1/2 -translate-y-[calc(100%+8px)] text-center`}
          >
            {game?.axis_top}
          </span>
          <span
            className={`${label} bottom-0 left-1/2 max-w-[85%] -translate-x-1/2 translate-y-[calc(100%+8px)] text-center`}
          >
            {game?.axis_bottom}
          </span>
          <span className={`${label} left-2 top-[calc(50%-6px)] max-w-[42%] -translate-y-full text-left`}>
            {game?.axis_left}
          </span>
          <span className={`${label} right-2 top-[calc(50%-6px)] max-w-[42%] -translate-y-full text-right`}>
            {game?.axis_right}
          </span>
        </div>
      </div>

      {/* Placed avatars */}
      {placements.map((p) => {
        const player = players.find((pl) => pl.id === p.placed_player_id)
        const pos = toPercent(p.x, p.y)
        const isDraggable = (p.placed_player_id === myPlayerId || p.placed_by_player_id === myPlayerId) && !showRevealed
        return (
          <PlacedDot
            key={p.id}
            placementId={p.id}
            pos={pos}
            player={player}
            isSelf={p.type === 'self'}
            showRevealed={showRevealed}
            draggable={isDraggable}
          />
        )
      })}
    </div>
  )
}

function PlacedDot({ placementId, pos, player, isSelf, showRevealed, draggable }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed-${placementId}`,
    disabled: !draggable,
  })

  if (!player) return null

  const fadedSelf = showRevealed && isSelf
  const opacity = isDragging ? 0.3 : fadedSelf ? 0.3 : 1

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...attributes, ...listeners } : {})}
      className="absolute z-10 flex flex-col items-center gap-0.5"
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translate(-50%, -50%)',
        opacity,
        touchAction: draggable ? 'none' : 'auto',
        cursor: draggable ? 'grab' : 'default',
      }}
    >
      <div
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-md"
        style={{ backgroundColor: player?.color || '#D1D5DB', border: '2px solid white' }}
      >
        {player?.avatar_url ? (
          <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold">{player?.name?.[0]?.toUpperCase()}</span>
        )}
      </div>
      {showRevealed && (
        <span className="text-[9px] font-bold text-ink bg-white/80 px-1 rounded-full leading-tight text-center max-w-[56px] truncate">
          {player.name}
        </span>
      )}
    </div>
  )
}
