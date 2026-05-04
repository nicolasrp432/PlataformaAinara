export default function LibraryLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-56 bg-muted/60 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-muted/40 rounded" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted/30 rounded-full" />
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
          >
            <div className="aspect-[16/9] bg-muted/25" />
            <div className="p-5 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 bg-muted/40 rounded-full" />
                <div className="h-5 w-20 bg-muted/30 rounded-full" />
              </div>
              <div className="h-5 w-4/5 bg-muted/50 rounded" />
              <div className="h-3 w-full bg-muted/30 rounded" />
              <div className="h-3 w-3/4 bg-muted/25 rounded" />
              <div className="h-9 w-full bg-muted/30 rounded-lg mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
