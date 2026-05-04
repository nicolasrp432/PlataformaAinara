export default function MentorshipLoading() {
  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16 animate-pulse">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 pt-4">
        <div className="h-7 w-40 bg-muted/40 rounded-full" />
        <div className="h-12 w-72 bg-muted/60 rounded-lg" />
        <div className="h-4 w-96 max-w-full bg-muted/40 rounded" />
      </div>

      {/* Mentor Cards Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden"
          >
            <div className="h-32 bg-muted/20" />
            <div className="px-8 pb-8">
              <div className="flex justify-between items-end -mt-16 mb-6">
                <div className="h-32 w-32 bg-muted/40 rounded-full border-[6px] border-background" />
                <div className="h-6 w-20 bg-muted/30 rounded-full mb-2" />
              </div>
              <div className="space-y-4">
                <div className="h-6 w-32 bg-muted/50 rounded" />
                <div className="h-3 w-40 bg-muted/30 rounded" />
                <div className="h-3 w-full bg-muted/25 rounded" />
                <div className="h-3 w-4/5 bg-muted/20 rounded" />
                <div className="flex gap-2 pt-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-6 w-20 bg-muted/25 rounded-full" />
                  ))}
                </div>
                <div className="h-12 w-full bg-muted/30 rounded-lg mt-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
