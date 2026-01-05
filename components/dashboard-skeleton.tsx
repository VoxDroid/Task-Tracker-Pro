import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface)] p-6 rounded-2xl border-2 border-[var(--color-border)] shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Completion Trend Chart */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <div className="flex items-center mb-6">
            <Skeleton className="h-6 w-6 mr-3 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>

        {/* Tasks by Status Chart */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>

      {/* Activity and Tasks Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-[var(--color-surface)] p-8 rounded-2xl border-2 border-[var(--color-border)] shadow-lg">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-5 w-5 rounded mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
