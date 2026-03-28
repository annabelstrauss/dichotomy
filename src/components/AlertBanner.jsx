export default function AlertBanner({ icon, children }) {
  return (
    <div
      className="flex items-center gap-2 rounded-[14px] border border-[#FDBA74]/90 bg-[#FFEDD5]/95 px-3.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm ring-1 ring-black/[0.04]"
      role="status"
    >
      {icon && <span className="flex-shrink-0 text-[15px] leading-none">{icon}</span>}
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-ink line-clamp-2">
        {children}
      </p>
    </div>
  )
}
