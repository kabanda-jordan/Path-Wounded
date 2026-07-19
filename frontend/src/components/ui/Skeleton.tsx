import { classNames } from '../../lib/formatters'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={classNames('animate-pulse bg-white/5 rounded', className)} />
}

export function StatCardSkeleton() {
  return (
    <div className="bg-dark-card border border-white/10 rounded-2xl p-5">
      <Skeleton className="w-10 h-10 rounded-xl mb-3" />
      <Skeleton className="w-24 h-8 mb-2" />
      <Skeleton className="w-16 h-4" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-dark-card border border-white/10 rounded-2xl p-5 space-y-3">
      <Skeleton className="w-full h-10" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="flex-1 h-8" />
          ))}
        </div>
      ))}
    </div>
  )
}
