import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { useGame } from '../hooks/useGame'
import Board from '../components/Board'
import PlayerTray from '../components/PlayerTray'
import PlayerChip from '../components/PlayerChip'
import AlertBanner from '../components/AlertBanner'

export default function GameBoard() {
  const { code } = useParams()
  const {
    game, players, assignments, placements,
    me, myTarget, mySelfPlacement, myAssignedPlacement,
    isHost,
    loading,
    submitPlacement, assignTargets, revealBoard,
  } = useGame(code)

  const [activePlayer, setActivePlayer] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 8 } })
  )

  if (loading) return <LoadingScreen />
  if (!game) return <div className="p-8 text-center text-muted">Game not found.</div>

  const gameState = game.state // 'self_placement' | 'assigned_placement' | 'results'
  const isRevealed = gameState === 'results'

  // What can this player drag? In self_placement: themselves. In assigned_placement: their target.
  const draggablePlayerId =
    gameState === 'self_placement' ? me?.id :
    gameState === 'assigned_placement' ? myTarget?.id :
    null

  // Which chip to highlight in tray
  const highlightId =
    gameState === 'self_placement' ? me?.id :
    gameState === 'assigned_placement' ? myTarget?.id :
    null

  // Tray label
  const trayLabel =
    gameState === 'self_placement' ? `PLAYERS · ${players.length} ONLINE` :
    gameState === 'assigned_placement' ? `PLAYERS · TARGET: ${myTarget?.name?.toUpperCase() || '...'}` :
    `PLAYERS · ${players.length} IN ROOM`

  // Count completed placements for progress
  const selfDone = players.filter(p => placements.some(pl => pl.placed_by_player_id === p.id && pl.type === 'self')).length
  const assignedDone = players.filter(p => placements.some(pl => pl.placed_by_player_id === p.id && pl.type === 'assigned')).length
  const allAssignedDone = assignments.length > 0 && assignedDone >= assignments.length

  // Board placements to show (hide others' placements before reveal)
  const visiblePlacements = isRevealed
    ? placements
    : placements.filter(p => p.placed_by_player_id === me?.id)

  // Legend for results
  const resultLegend = isRevealed ? deriveResultPlacements(players, placements) : []

  async function handleDragEnd(event) {
    const { active, over } = event
    setActivePlayer(null)
    if (!over || over.id !== 'board' || !me) return

    const boardEl = document.getElementById('board-container')
    if (!boardEl) return
    const rect = boardEl.getBoundingClientRect()

    // Final pointer position = where drag started + how far it moved
    const pointerX = (event.activatorEvent?.clientX ?? 0) + event.delta.x
    const pointerY = (event.activatorEvent?.clientY ?? 0) + event.delta.y

    const relX = pointerX - rect.left
    const relY = pointerY - rect.top
    const x = Math.max(-1, Math.min(1, (relX / rect.width) * 2 - 1))
    const y = Math.max(-1, Math.min(1, 1 - (relY / rect.height) * 2))

    const type = gameState === 'self_placement' ? 'self' : 'assigned'

    setSubmitting(true)
    await submitPlacement(type, x, y)
    setSubmitting(false)
  }

  function handleDragStart(event) {
    // Drag can start from tray chip ("player-{id}") or placed dot on board ("placed-{placementId}")
    const activeId = event.active.id
    let player = null
    if (activeId.startsWith('placed-')) {
      // Find the placement, then the player
      const placementId = activeId.replace('placed-', '')
      const placement = placements.find(p => p.id === placementId)
      player = placement ? players.find(p => p.id === placement.placed_player_id) : null
    } else {
      const playerId = activeId.replace('player-', '')
      player = players.find(p => p.id === playerId) || null
    }
    setActivePlayer(player)
  }

  async function handleAssignTargets() {
    setSubmitting(true)
    await assignTargets()
    setSubmitting(false)
  }

  async function handleReveal() {
    setSubmitting(true)
    await revealBoard()
    setSubmitting(false)
  }

  const hostTrayFabClass =
    'absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-violet-600 px-7 py-2.5 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.45)] transition-opacity active:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))]'

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-[100dvh] bg-bg flex flex-col overflow-hidden" style={{ maxWidth: 390, margin: '0 auto', width: '100%' }}>

        {/* Title + instruction overlay — banner hangs below header; board has top padding so axes never sit under it */}
        <div className="relative z-20 flex flex-shrink-0 flex-col px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <span className="text-center text-[23px] font-extrabold text-ink">{game.title || 'Dichotomies'}</span>
          {!isRevealed && (
            <div className="pointer-events-none absolute left-4 right-4 top-full mt-1 flex justify-center">
              {gameState === 'self_placement' && !mySelfPlacement && (
                <AlertBanner icon="✋">Put yourself on the board from the tray.</AlertBanner>
              )}
              {gameState === 'self_placement' && mySelfPlacement && !isHost && (
                <AlertBanner icon="⏳">Placed. Wait for the host to assign targets.</AlertBanner>
              )}
              {gameState === 'assigned_placement' && !myAssignedPlacement && myTarget && (
                <AlertBanner icon="✋">
                  Drag <strong>{myTarget.name}</strong> from the tray to the board.
                </AlertBanner>
              )}
              {gameState === 'assigned_placement' &&
                myAssignedPlacement &&
                !allAssignedDone &&
                !isHost && (
                  <AlertBanner icon="⏳">Placed. Wait for everyone else to finish.</AlertBanner>
                )}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 px-4 pb-3 pt-14">
          <Board
            game={game}
            players={players}
            placements={visiblePlacements}
            showRevealed={isRevealed}
            myPlayerId={me?.id}
          />
        </div>

        {/* Player tray — fixed height; host “Next” floats above tray */}
        <div className="relative flex-shrink-0 h-48">
          <PlayerTray
            players={players}
            label={trayLabel}
            highlightId={highlightId}
            draggableId={draggablePlayerId}
          />
          {isHost && gameState === 'self_placement' && (
            <button
              type="button"
              onClick={handleAssignTargets}
              disabled={submitting || players.length < 2}
              className={hostTrayFabClass}
            >
              Next
            </button>
          )}
          {isHost && gameState === 'assigned_placement' && allAssignedDone && (
            <button type="button" onClick={handleReveal} disabled={submitting} className={hostTrayFabClass}>
              Reveal 🎉
            </button>
          )}
        </div>
      </div>

      {/* Drag overlay — no snap-back: duration 0 kills the return animation */}
      <DragOverlay dropAnimation={{ duration: 0, easing: 'linear' }}>
        {activePlayer && (
          <div style={{ transform: 'scale(1.1)', opacity: 0.9 }}>
            <PlayerChip player={activePlayer} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
      <div className="text-[15px] text-muted font-medium">Loading…</div>
    </div>
  )
}

function deriveResultPlacements(players, placements) {
  return players.map(p => ({
    player: p,
    self: placements.find(pl => pl.placed_player_id === p.id && pl.type === 'self'),
    buddy: placements.find(pl => pl.placed_player_id === p.id && pl.type === 'assigned'),
  }))
}
