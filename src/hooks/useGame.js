import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useGame(gameCode) {
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [assignments, setAssignments] = useState([])
  const [placements, setPlacements] = useState([])
  const [optimisticPlacements, setOptimisticPlacements] = useState([])
  const [loading, setLoading] = useState(true)

  // Session identity
  const sessionId = sessionStorage.getItem(`session_${gameCode}`)
  const playerId = sessionStorage.getItem(`player_${gameCode}`)
  const isHost = sessionStorage.getItem(`host_${gameCode}`) === 'true'

  // Fetch full state
  const fetchAll = useCallback(async () => {
    const [gameRes, playersRes, assignmentsRes, placementsRes] = await Promise.all([
      supabase.from('games').select('*').eq('id', gameCode).single(),
      supabase.from('players').select('*').eq('game_id', gameCode).order('joined_at'),
      supabase.from('assignments').select('*').eq('game_id', gameCode),
      supabase.from('placements').select('*').eq('game_id', gameCode),
    ])
    if (gameRes.data) setGame(gameRes.data)
    if (playersRes.data) setPlayers(playersRes.data)
    if (assignmentsRes.data) setAssignments(assignmentsRes.data)
    if (placementsRes.data) setPlacements(placementsRes.data)
    setLoading(false)
  }, [gameCode])

  useEffect(() => {
    if (!gameCode) return
    fetchAll()

    const channel = supabase
      .channel(`game:${gameCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameCode}` },
        (payload) => {
          if (payload.new) setGame(payload.new)

          // Bulk placement deletes often don't reliably fan out to every client over Realtime.
          // When the game (re)enters self_placement from another phase, resync from DB and drop
          // local optimistic dots so everyone's board matches the host after "next round".
          const newRow = payload.new
          const oldRow = payload.old
          const ev = payload.eventType
          const entersSelfPlacement =
            newRow?.state === 'self_placement' &&
            (ev === 'INSERT' ||
              (ev === 'UPDATE' && (!oldRow || oldRow.state !== 'self_placement')))

          if (entersSelfPlacement) {
            setOptimisticPlacements([])
            void Promise.all([
              supabase
                .from('placements')
                .select('*')
                .eq('game_id', gameCode)
                .then(({ data }) => setPlacements(data ?? [])),
              supabase
                .from('assignments')
                .select('*')
                .eq('game_id', gameCode)
                .then(({ data }) => setAssignments(data ?? [])),
            ])
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameCode}` },
        () => fetchAll()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments', filter: `game_id=eq.${gameCode}` },
        () =>
          supabase
            .from('assignments')
            .select('*')
            .eq('game_id', gameCode)
            .then(({ data }) => setAssignments(data ?? []))
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'placements', filter: `game_id=eq.${gameCode}` },
        () =>
          supabase
            .from('placements')
            .select('*')
            .eq('game_id', gameCode)
            .then(({ data }) => setPlacements(data ?? []))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameCode, fetchAll])

  // Derived state
  const me = players.find((p) => p.id === playerId) || null
  const myAssignment = assignments.find((a) => a.assigner_id === playerId) || null
  const myTarget = myAssignment ? players.find((p) => p.id === myAssignment.target_id) : null

  // Merge optimistic placements: they win over server state for the same (placer, type) slot
  const mergedPlacements = [
    ...placements.filter(p =>
      !optimisticPlacements.some(op => op.placed_by_player_id === p.placed_by_player_id && op.type === p.type)
    ),
    ...optimisticPlacements,
  ]

  const mySelfPlacement = mergedPlacements.find((p) => p.placed_by_player_id === playerId && p.type === 'self')
  const myAssignedPlacement = mergedPlacements.find((p) => p.placed_by_player_id === playerId && p.type === 'assigned')

  // Actions
  async function submitPlacement(type, x, y) {
    const targetId = type === 'self' ? playerId : myAssignment?.target_id
    if (!targetId) return

    const newId = crypto.randomUUID()

    // Optimistic update — show on board immediately, no waiting for Realtime
    setOptimisticPlacements(prev => [
      ...prev.filter(p => !(p.placed_by_player_id === playerId && p.type === type)),
      { id: newId, game_id: gameCode, placed_player_id: targetId, placed_by_player_id: playerId, type, x, y },
    ])

    // Persist to Supabase (delete old, insert new)
    await supabase.from('placements').delete()
      .eq('game_id', gameCode)
      .eq('placed_by_player_id', playerId)
      .eq('type', type)

    await supabase.from('placements').insert({
      id: newId,
      game_id: gameCode,
      placed_player_id: targetId,
      placed_by_player_id: playerId,
      type,
      x,
      y,
    })
    // Realtime will sync and replace the optimistic entry automatically
  }

  async function assignTargets() {
    if (!isHost) return
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const assignments = shuffled.map((p, i) => {
      // Find next player that isn't self
      let targetIndex = (i + 1) % shuffled.length
      while (shuffled[targetIndex].id === p.id) targetIndex = (targetIndex + 1) % shuffled.length
      return {
        id: crypto.randomUUID(),
        game_id: gameCode,
        assigner_id: p.id,
        target_id: shuffled[targetIndex].id,
      }
    })

    await supabase.from('assignments').insert(assignments)
    await supabase.from('games').update({ state: 'assigned_placement' }).eq('id', gameCode)
  }

  async function revealBoard() {
    if (!isHost) return
    await supabase.from('games').update({ state: 'results' }).eq('id', gameCode)
  }

  async function startNextRound(axes) {
    if (!isHost) return
    const top = (axes?.top || 'MYSTERIOUS').toUpperCase()
    const bottom = (axes?.bottom || 'GAB').toUpperCase()
    const left = (axes?.left || 'BANT').toUpperCase()
    const right = (axes?.right || 'EARNEST').toUpperCase()

    await supabase.from('placements').delete().eq('game_id', gameCode)
    await supabase.from('assignments').delete().eq('game_id', gameCode)
    const { data: updatedGame, error: gameErr } = await supabase
      .from('games')
      .update({
        axis_top: top,
        axis_bottom: bottom,
        axis_left: left,
        axis_right: right,
        state: 'self_placement',
      })
      .eq('id', gameCode)
      .select()
      .single()

    setOptimisticPlacements([])
    setPlacements([])
    setAssignments([])
    if (!gameErr && updatedGame) setGame(updatedGame)
  }

  return {
    game, players, assignments, placements: mergedPlacements,
    me, myTarget, mySelfPlacement, myAssignedPlacement,
    isHost, sessionId, playerId,
    loading,
    submitPlacement, assignTargets, revealBoard, startNextRound,
  }
}
