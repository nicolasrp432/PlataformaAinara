export default function LessonLoading() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 lg:gap-6">
        {/* Main content */}
        <div className="space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-muted/30 rounded-xl border border-border/30" />

          {/* Lesson Info */}
          <div className="space-y-3 px-1">
            <div className="h-7 w-3/4 bg-muted/50 rounded" />
            <div className="h-4 w-full bg-muted/25 rounded" />
            <div className="h-4 w-2/3 bg-muted/25 rounded" />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-1">
            <div className="h-10 w-32 bg-muted/30 rounded-xl" />
            <div className="h-10 w-32 bg-muted/30 rounded-xl" />
          </div>

          {/* Comments Section */}
          <div className="border-t border-border/30 pt-6 space-y-4 px-1">
            <div className="h-6 w-32 bg-muted/40 rounded" />
            <div className="h-20 w-full bg-muted/20 rounded-xl border border-border/20" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-muted/30 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted/40 rounded" />
                  <div className="h-3 w-full bg-muted/20 rounded" />
                  <div className="h-3 w-3/4 bg-muted/20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Curriculum */}
        <div className="hidden lg:block space-y-3 border-l border-border/30 pl-6">
          <div className="h-5 w-32 bg-muted/40 rounded" />
          <div className="h-3 w-20 bg-muted/20 rounded" />
          <div className="h-2 w-full bg-muted/20 rounded-full mt-2" />
          <div className="space-y-2 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-2">
                <div className="h-4 w-4 rounded bg-muted/30 shrink-0" />
                <div className="h-4 flex-1 bg-muted/25 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
