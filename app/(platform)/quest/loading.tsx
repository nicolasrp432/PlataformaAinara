export default function QuestLoading() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 animate-pulse">
      {/* Hero Header */}
      <div className="rounded-3xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-4 text-center md:text-left w-full">
          <div className="h-5 w-32 bg-muted/30 rounded-full mx-auto md:mx-0" />
          <div className="h-10 w-3/4 bg-muted/50 rounded-lg mx-auto md:mx-0" />
          <div className="h-4 w-full max-w-md bg-muted/25 rounded mx-auto md:mx-0" />
        </div>
        <div className="w-full md:w-64 rounded-2xl border border-border/30 bg-background/50 p-6 space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted/30 mx-auto" />
          <div className="h-3 w-full bg-muted/20 rounded-full" />
        </div>
      </div>

      {/* Quests Grid */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-40 bg-muted/40 rounded" />
            <div className="h-5 w-28 bg-muted/20 rounded-full ml-auto" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card/30 p-5 flex items-start gap-5"
            >
              <div className="h-14 w-14 rounded-full bg-muted/30 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 w-1/2 bg-muted/40 rounded" />
                <div className="h-4 w-full bg-muted/25 rounded" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border/30 bg-card/30 p-6 space-y-4">
            <div className="h-5 w-24 bg-muted/40 rounded" />
            <div className="h-24 w-full bg-muted/15 rounded-xl border border-dashed border-border/20" />
          </div>
        </div>
      </div>
    </div>
  )
}
