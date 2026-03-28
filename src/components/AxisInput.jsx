export default function AxisInput({ placeholder, value, onChange, widthClass = 'w-20' }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      maxLength={12}
      className={`${widthClass} shrink-0 text-center bg-transparent border-b-2 border-primary py-1 text-[12px] font-bold text-ink placeholder:text-muted uppercase tracking-wider outline-none`}
    />
  )
}
