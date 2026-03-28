import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import PrimaryButton from '../components/PrimaryButton'
import AxisInput from '../components/AxisInput'

const DEFAULT_AXES = { top: 'MYSTERIOUS', bottom: 'GAB', left: 'BANT', right: 'EARNEST' }

export default function CreateGame() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [axes, setAxes] = useState(DEFAULT_AXES)
  const [loading, setLoading] = useState(false)

  const axis = (key) => ({
    value: axes[key],
    onChange: (e) => setAxes((a) => ({ ...a, [key]: e.target.value.toUpperCase() })),
  })

  async function handleCreate() {
    setLoading(true)
    const code = nanoid(6)
    const hostSessionId = nanoid()
    const { error } = await supabase.from('games').insert({
      id: code,
      title: title || 'Dichotomy',
      axis_top: axes.top || 'MYSTERIOUS',
      axis_bottom: axes.bottom || 'GAB',
      axis_left: axes.left || 'BANT',
      axis_right: axes.right || 'EARNEST',
      host_session_id: hostSessionId,
      state: 'self_placement',
    })
    if (error) { console.error(error); setLoading(false); return }

    // Mark as host so GameBoard knows later
    sessionStorage.setItem(`host_${code}`, 'true')

    // Copy the link, then send host through the same join form as everyone else
    const link = `${window.location.origin}/g/${code}`
    await navigator.clipboard.writeText(link).catch(() => {})
    navigate(`/g/${code}`)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-4 max-w-[390px] mx-auto pt-[max(2rem,env(safe-area-inset-top,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="shrink-0 mb-2">
        <h1 className="font-rubik text-[28px] font-extrabold italic tracking-tight text-ink text-center">DICHOTOMY</h1>
      </div>

      {/* Board + title + CTA — biased lower in the viewport for optical vertical balance */}
      <div className="flex-1 flex flex-col justify-center min-h-0 pt-10 pb-6">
        {/* Board preview */}
        <div className="relative bg-white/40 rounded-[20px] px-3 py-5 mb-4 shadow-sm">
          {/* Cross: centered in the card; label widths cannot shift it */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[clamp(96px,36vw,148px)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white/20"
            aria-hidden
          >
            <div className="absolute inset-0 flex items-center">
              <div className="h-[2px] w-full bg-board-line" />
            </div>
            <div className="absolute inset-0 flex justify-center">
              <div className="h-full w-[2px] bg-board-line" />
            </div>
          </div>

          {/* Top */}
          <div className="relative z-10 mb-2 flex justify-center">
            <AxisInput placeholder="TOP" {...axis('top')} />
          </div>

          {/* Left / spacer / Right — spacer matches cross so side columns stay symmetric */}
          <div className="relative z-10 mb-2 flex items-center gap-1.5">
            <div className="flex min-w-0 flex-1 justify-end">
              <AxisInput placeholder="LEFT" {...axis('left')} />
            </div>
            <div
              className="invisible aspect-square w-[clamp(96px,36vw,148px)] shrink-0 pointer-events-none"
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 justify-start">
              <AxisInput placeholder="RIGHT" {...axis('right')} />
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 flex justify-center">
            <AxisInput placeholder="BOTTOM" {...axis('bottom')} />
          </div>
        </div>

        {/* Title (optional) */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Game title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface border border-[#E7E5E4] rounded-[14px] px-4 py-3.5 text-[15px] text-ink placeholder:text-muted outline-none focus:border-primary"
          />
        </div>

        {/* CTA */}
        <PrimaryButton onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create & copy link'}
        </PrimaryButton>
      </div>
    </div>
  )
}
