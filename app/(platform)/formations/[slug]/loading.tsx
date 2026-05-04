export default function FormationDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
        <div className="h-48 sm:h-64 bg-muted/30" />
        <div className="p-6 sm:p-8 space-y-4">
          <div className="h-8 w-3/4 bg-muted/50 rounded-lg" />
          <div className="h-4 w-full bg-muted/30 rounded" />
          <div className="h-4 w-2/3 bg-muted/30 rounded" />
          <div className="flex gap-3 mt-4">
            <div className="h-5 w-20 bg-muted/30 rounded-full" />
            <div className="h-5 w-24 bg-muted/30 rounded-full" />
            <div className="h-5 w-16 bg-muted/30 rounded-full" />
          </div>
          <div className="h-11 w-40 bg-muted/40 rounded-xl mt-4" />
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        <div className="h-7 w-40 bg-muted/40 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 p-5 space-y-3"
          >
            <div className="h-5 w-2/3 bg-muted/40 rounded" />
            <div className="space-y-2 pl-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-muted/30 shrink-0" />
                  <div className="h-4 w-3/4 bg-muted/25 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
