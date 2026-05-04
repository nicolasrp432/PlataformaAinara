export default function ProfileLoading() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-9 w-36 bg-muted/60 rounded-lg" />
        <div className="h-4 w-80 max-w-full bg-muted/40 rounded" />
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
            <div className="h-28 bg-muted/20" />
            <div className="px-6 pb-6 text-center">
              <div className="flex justify-center -mt-14 mb-5">
                <div className="h-28 w-28 bg-muted/40 rounded-full border-[6px] border-background" />
              </div>
              <div className="h-5 w-32 bg-muted/50 rounded mx-auto" />
              <div className="h-3 w-48 bg-muted/30 rounded mx-auto mt-2" />
              <div className="flex justify-center gap-2 mt-4">
                <div className="h-6 w-20 bg-muted/30 rounded-full" />
                <div className="h-6 w-16 bg-muted/30 rounded-full" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-5">
            <div className="h-5 w-24 bg-muted/50 rounded" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted/30 rounded-lg" />
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-muted/40 rounded" />
                    <div className="h-2 w-20 bg-muted/25 rounded" />
                  </div>
                </div>
                <div className="h-6 w-8 bg-muted/40 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-4">
            <div className="h-5 w-40 bg-muted/50 rounded" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-muted/20 rounded-lg" />
              <div className="h-10 w-full bg-muted/20 rounded-lg" />
              <div className="h-10 w-full bg-muted/20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
