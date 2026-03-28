export default function PrimaryButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-[14px] px-5 bg-primary text-white font-semibold text-[14px] rounded-full
        active:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${className}`}
    >
      {children}
    </button>
  )
}
