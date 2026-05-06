export default function LessonLoading() {
  return (
    <div className="animate-pulse min-h-screen bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border/30 bg-background/95 flex items-center px-4 gap-4 pl-14 md:pl-4">
        <div className="h-8 w-20 bg-muted/40 rounded-md" />
        <div className="h-5 w-px bg-border/50" />
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-muted/50 rounded" />
          <div className="h-3 w-32 bg-muted/30 rounded" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="h-2 w-32 bg-muted/30 rounded-full" />
            <div className="h-4 w-10 bg-muted/30 rounded" />
          </div>
          <div className="h-8 w-24 bg-muted/30 rounded-md" />
        </div>
      </div>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Video area */}
          <div className="aspect-video bg-muted/20" />

          {/* Lesson info */}
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted/40 rounded-full" />
                <div className="h-7 w-3/4 bg-muted/50 rounded" />
              </div>
              <div className="h-5 w-16 bg-muted/30 rounded" />
            </div>

            {/* Complete button */}
            <div className="h-16 w-full bg-muted/20 rounded-xl border border-border/20" />

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/25 rounded" />
              <div className="h-4 w-5/6 bg-muted/25 rounded" />
              <div className="h-4 w-3/4 bg-muted/20 rounded" />
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-border/30">
              <div className="h-10 w-32 bg-muted/30 rounded-xl" />
              <div className="h-10 w-32 bg-muted/30 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Sidebar — hidden on mobile, fixed width on desktop */}
        <div className="hidden md:block w-80 border-l border-border/30">
          <div className="p-4 space-y-4">
            <div className="h-5 w-32 bg-muted/40 rounded" />
            <div className="h-2 w-full bg-muted/20 rounded-full" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-6 w-6 rounded-full bg-muted/30 shrink-0" />
                <div className="h-4 flex-1 bg-muted/25 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
