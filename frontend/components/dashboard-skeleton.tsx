import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border-0 shadow-sm p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
      <Skeleton className="h-4 w-32" />
      <div className="flex items-center space-x-2 pt-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border-0 shadow-md p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-3">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-white border-0 shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="h-[400px] w-full mt-4 relative">
        <Skeleton className="absolute bottom-0 left-0 right-0 h-[60%] rounded-lg" />
        <div className="absolute bottom-0 left-0 right-0 h-[60%] flex items-end justify-between px-4">
          {Array(12)
            .fill(null)
            .map((_, i) => (
              <Skeleton
                key={i}
                className="w-[5%] rounded-t-lg"
                style={{
                  height: `${Math.random() * 70 + 20}%`,
                  opacity: 0.7 - i * 0.05,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 space-y-8">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 -mx-8 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ListSkeleton />
        <ListSkeleton />
      </div>

      <ChartSkeleton />
    </div>
  )
}
