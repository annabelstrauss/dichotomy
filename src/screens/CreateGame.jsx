import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import PrimaryButton from '../components/PrimaryButton'
import AxisInput from '../components/AxisInput'

const DEFAULT_AXES = { top: 'FUNNY', bottom: 'MEAN', left: 'DOG', right: 'CAT' }

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
      axis_top: axes.top || 'FUNNY',
      axis_bottom: axes.bottom || 'MEAN',
      axis_left: axes.left || 'DOG',
      axis_right: axes.right || 'CAT',
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
        <div className="bg-white/40 rounded-[20px] px-3 py-5 mb-4 shadow-sm">
          {/* Top */}
          <div className="flex justify-center mb-2">
            <AxisInput placeholder="TOP" {...axis('top')} />
          </div>

          {/* Left / Right */}
          <div className="flex items-center gap-1.5 mb-2">
            <AxisInput placeholder="LEFT" widthClass="w-16" {...axis('left')} />
            <div className="flex-1 min-w-0 aspect-square bg-white/20 rounded-[14px] relative">
              {/* Cross lines */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-[2px] bg-board-line" />
              </div>
              <div className="absolute inset-0 flex justify-center">
                <div className="h-full w-[2px] bg-board-line" />
              </div>
            </div>
            <AxisInput placeholder="RIGHT" widthClass="w-16" {...axis('right')} />
          </div>

          {/* Bottom */}
          <div className="flex justify-center">
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
