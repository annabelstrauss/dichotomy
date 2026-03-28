import { useDraggable } from '@dnd-kit/core'
import PlayerChip from './PlayerChip'

export default function PlayerTray({ players, label, highlightId, draggableId }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-[24px] bg-surface pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      {/* One scroll surface: title + grid move together (no fixed header clipping the first row) */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 [scrollbar-gutter:stable]">
        {label && (
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-muted">{label}</p>
        )}
        <div className="grid grid-cols-4 content-start justify-items-center gap-x-2 gap-y-3 pb-2">
          {players.map((player) => {
            const isDraggable = player.id === draggableId
            if (isDraggable) {
              return (
                <DraggableChip
                  key={player.id}
                  player={player}
                  highlight={player.id === highlightId}
                  dragId={`player-${player.id}`}
                />
              )
            }
            return (
              <PlayerChip key={player.id} player={player} highlight={player.id === highlightId} />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DraggableChip({ player, highlight, dragId }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="min-w-0"
      style={{ opacity: isDragging ? 0.3 : 1, touchAction: 'none', cursor: 'grab' }}
    >
      <PlayerChip player={player} highlight={highlight} />
    </div>
  )
}
