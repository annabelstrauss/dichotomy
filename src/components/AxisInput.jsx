export default function AxisInput({ placeholder, value, onChange }) {
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
