export default function PlatformLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted/60 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-muted/40 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-40 bg-muted/30" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-muted/50 rounded" />
              <div className="h-3 w-full bg-muted/30 rounded" />
              <div className="h-3 w-2/3 bg-muted/30 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
