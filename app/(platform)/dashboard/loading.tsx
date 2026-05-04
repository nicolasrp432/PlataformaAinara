export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-72 bg-muted/60 rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-muted/40 rounded mt-2" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-20 bg-muted/50 rounded" />
              <div className="h-4 w-4 bg-muted/40 rounded" />
            </div>
            <div className="h-7 w-16 bg-muted/60 rounded" />
            <div className="h-3 w-24 bg-muted/30 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-muted/50 rounded" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-muted/50 rounded" />
                  <div className="h-3 w-1/2 bg-muted/30 rounded" />
                  <div className="h-2 w-full bg-muted/20 rounded-full mt-2" />
                </div>
                <div className="h-9 w-24 bg-muted/40 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="h-6 w-36 bg-muted/50 rounded" />
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-8 w-8 bg-muted/40 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full bg-muted/40 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
