export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-72 bg-muted/50 rounded-lg" />
        <div className="h-4 w-64 bg-muted/30 rounded" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted/40 rounded" />
              <div className="h-4 w-4 bg-muted/30 rounded" />
            </div>
            <div className="h-7 w-20 bg-muted/50 rounded" />
            <div className="h-3 w-32 bg-muted/20 rounded" />
          </div>
        ))}
      </div>

      {/* Continue Learning + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-muted/40 rounded" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card/30 p-6 space-y-3"
            >
              <div className="h-5 w-3/4 bg-muted/40 rounded" />
              <div className="h-3 w-40 bg-muted/30 rounded" />
              <div className="h-2 w-full bg-muted/20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="h-6 w-40 bg-muted/40 rounded" />
          <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/30 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted/40 rounded" />
                  <div className="h-3 w-16 bg-muted/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
