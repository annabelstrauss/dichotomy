import { useLayoutEffect, useRef, useState } from 'react'

const MIRROR_CLASS =
  'pointer-events-none absolute left-0 top-0 whitespace-pre font-sans text-[12px] font-bold uppercase tracking-wider text-ink'

export default function AxisInput({ placeholder, value, onChange }) {
  const mirrorRef = useRef(null)
  const [widthPx, setWidthPx] = useState(0)

  const measureText = (value && value.length > 0 ? value : placeholder).toUpperCase()

  useLayoutEffect(() => {
    const el = mirrorRef.current
    if (!el) return
    const w = el.getBoundingClientRect().width
    // Small buffer so the caret and last letter aren’t clipped; min width for short placeholders
    setWidthPx(Math.max(Math.ceil(w) + 10, 36))
  }, [measureText])

  return (
    <span className="relative inline-block max-w-full align-bottom">
      <span ref={mirrorRef} aria-hidden className={`${MIRROR_CLASS} opacity-0`}>
        {measureText}
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={12}
        style={{ width: widthPx || undefined, minWidth: widthPx ? undefined : '2.5rem' }}
        className="box-border max-w-full bg-transparent border-b-2 border-primary py-1 text-center font-sans text-[12px] font-bold uppercase tracking-wider text-ink outline-none placeholder:text-muted"
      />
    </span>
  )
}
