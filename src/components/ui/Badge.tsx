interface BadgeProps {
  count: number
  max?: number
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null
  const label = count > max ? `${max}+` : String(count)
  return (
    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-indigo text-white text-[10px] font-bold flex items-center justify-center leading-none">
      {label}
    </span>
  )
}
