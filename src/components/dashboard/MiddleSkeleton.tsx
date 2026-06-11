import { SkeletonCard } from './SkeletonCard'

export function MiddleSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-[280px]" />
        </div>
        <SkeletonCard className="h-full" />
      </div>
      <SkeletonCard className="flex-1" />
    </div>
  )
}
