import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import PrimaryButton from '../components/PrimaryButton'

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
      title: title || 'Dichotomies',
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
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold text-ink">Dichotomies</h1>
        <p className="text-[13px] text-muted mt-1">Party game on a 2×2 board. Place your friends.</p>
      </div>

      {/* Board preview */}
      <div className="bg-surface rounded-[20px] p-5 mb-4 shadow-sm">
        <p className="text-[12px] font-bold text-muted uppercase tracking-wider mb-3">Axis labels</p>

        {/* Top */}
        <div className="flex justify-center mb-2">
          <AxisInput placeholder="TOP" {...axis('top')} />
        </div>

        {/* Left / Right */}
        <div className="flex items-center gap-2 mb-2">
          <AxisInput placeholder="LEFT" {...axis('left')} />
          <div className="flex-1 aspect-square bg-board-faint rounded-[14px] relative border border-[#E7E5E4]">
            {/* Cross lines */}
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[2px] bg-board-line" />
            </div>
            <div className="absolute inset-0 flex justify-center">
              <div className="h-full w-[2px] bg-board-line" />
            </div>
          </div>
          <AxisInput placeholder="RIGHT" {...axis('right')} />
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
  )
}

function AxisInput({ placeholder, value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={12}
      className="w-20 text-center bg-transparent border-b-2 border-[#E7E5E4] focus:border-primary py-1 text-[12px] font-bold text-ink placeholder:text-muted uppercase tracking-wider outline-none"
    />
  )
}
