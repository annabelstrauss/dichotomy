import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import { PLAYER_COLORS } from '../components/PlayerChip'
import PrimaryButton from '../components/PrimaryButton'

export default function JoinGame() {
  const { code } = useParams()
  const navigate = useNavigate()
  const isHost = sessionStorage.getItem(`host_${code}`) === 'true'
  const [name, setName] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleJoin() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoading(true)
    setError(null)

    try {
      // Count existing players to assign a color
      const { data: existingPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('game_id', code)
      const colorIndex = (existingPlayers?.length || 0) % PLAYER_COLORS.length

      // Upload avatar if provided
      let avatarUrl = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const filename = `${code}/${nanoid()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filename, photoFile, { contentType: photoFile.type })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
        avatarUrl = urlData.publicUrl
      }

      const sessionId = nanoid()
      const playerId = nanoid()
      const { error: insertError } = await supabase.from('players').insert({
        id: playerId,
        game_id: code,
        name: name.trim(),
        avatar_url: avatarUrl,
        session_id: sessionId,
        color: PLAYER_COLORS[colorIndex],
      })
      if (insertError) throw insertError

      sessionStorage.setItem(`session_${code}`, sessionId)
      sessionStorage.setItem(`player_${code}`, playerId)

      navigate(`/g/${code}`)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col px-4 max-w-[390px] mx-auto pt-[max(2rem,env(safe-area-inset-top,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold text-ink">Join this board</h1>
        <p className="text-[13px] text-primary font-semibold mt-0.5">A Dichotomy room</p>
      </div>

      {/* Host: link copied confirmation */}
      {isHost && (
        <div className="flex items-center gap-2 bg-[#FFEDD5] border border-[#FDBA74] rounded-[14px] px-3.5 py-2.5 mb-4">
          <span className="text-sm">🔗</span>
          <p className="text-[13px] text-ink font-medium">Link copied! Share it with your friends while you set up.</p>
        </div>
      )}

      {/* Name input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface border border-[#E7E5E4] rounded-[14px] px-4 py-3.5 text-[15px] text-ink placeholder:text-muted outline-none focus:border-primary"
          autoFocus
        />
      </div>

      {/* Photo upload */}
      <div
        className="w-full rounded-[20px] border-2 border-dashed border-[#FDBA74] flex flex-col items-center justify-center gap-2 cursor-pointer mb-5"
        style={{ height: 188 }}
        onClick={() => fileRef.current?.click()}
      >
        {photoPreview ? (
          <img src={photoPreview} alt="preview" className="h-full w-full object-cover rounded-[18px]" />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-[#FFEDD5] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <span className="text-[13px] text-muted font-medium">Upload or take a picture</span>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} className="hidden" />
      </div>

      {error && <p className="text-red-500 text-[13px] mb-3">{error}</p>}

      <PrimaryButton onClick={handleJoin} disabled={loading || !name.trim()}>
        {loading ? 'Joining…' : 'Join the board'}
      </PrimaryButton>

      <p className="text-[12px] text-muted text-center mt-4 px-2">
        By joining you agree to share your name and photo with other players in this room.
      </p>
    </div>
  )
}
