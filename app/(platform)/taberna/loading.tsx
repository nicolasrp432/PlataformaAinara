export default function TabernaLoading() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 animate-pulse">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <div className="h-9 w-44 bg-muted/60 rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-muted/40 rounded" />
      </div>

      {/* Compose box */}
      <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-5">
        <div className="h-24 w-full bg-muted/20 rounded-lg" />
        <div className="flex justify-end mt-3">
          <div className="h-9 w-28 bg-muted/40 rounded-lg" />
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        <div className="h-6 w-32 bg-muted/50 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-5"
          >
            <div className="flex gap-4">
              <div className="h-10 w-10 bg-muted/40 rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-muted/50 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
                <div className="h-3 w-full bg-muted/30 rounded" />
                <div className="h-3 w-5/6 bg-muted/25 rounded" />
                <div className="h-3 w-2/3 bg-muted/20 rounded" />
                <div className="flex gap-6 pt-3 border-t border-border/20 mt-3">
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                  <div className="h-3 w-16 bg-muted/30 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
