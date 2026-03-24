import { Sparkles } from "lucide-react"

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
        </div>
        <div className="text-xl font-light text-foreground/80 tracking-widest">
          AINARA
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-full" style={{ backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)", backgroundSize: "200% 100%" }} />
        </div>
      </div>
    </div>
  )
}
