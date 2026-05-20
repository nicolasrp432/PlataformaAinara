export default function PlatformLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 shimmer rounded-lg" />
        <div className="h-4 w-96 max-w-full shimmer rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-40 shimmer" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 shimmer rounded" />
              <div className="h-3 w-full shimmer rounded" />
              <div className="h-3 w-2/3 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
