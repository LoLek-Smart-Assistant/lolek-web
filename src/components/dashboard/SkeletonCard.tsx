type SkeletonCardProps = {
  className: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04] ${className}`}
    >
      <div className="h-full w-full rounded-[28px] bg-[linear-gradient(110deg,rgba(255,255,255,0.04),rgba(255,255,255,0.09),rgba(255,255,255,0.04))]" />
    </div>
  )
}
