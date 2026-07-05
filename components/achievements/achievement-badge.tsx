import { CheckCircle2, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TIER_LABELS, type ComputedAchievement } from "@/lib/achievements"

/**
 * Insignia de logro compartida por /quest, /profile y /u/[userId].
 * Un solo lenguaje visual (dorado del tema) con intensidad por nivel:
 * inicio < camino < cumbre. Sin grayscale ni colores fuera de paleta.
 */

const TIER_DISC: Record<ComputedAchievement["tier"], string> = {
  inicio: "bg-primary/10 text-primary",
  camino: "bg-primary/15 text-primary ring-1 ring-primary/25",
  cumbre: "gold-gradient text-white shadow-sm",
}

export function AchievementCard({ achievement }: { achievement: ComputedAchievement }) {
  const Icon = achievement.icon
  const { unlocked } = achievement

  return (
    <div
      className={cn(
        "relative border rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden h-full",
        unlocked
          ? "bg-card border-border hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
          : "bg-muted/20 border-border/50 opacity-60"
      )}
    >
      {unlocked && (
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0",
              unlocked ? TIER_DISC[achievement.tier] : "bg-muted text-muted-foreground/50"
            )}
          >
            {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          </div>

          {unlocked ? (
            <Badge
              variant="outline"
              className="text-[9px] uppercase font-bold tracking-wider text-primary border-primary/25 bg-primary/5"
            >
              {TIER_LABELS[achievement.tier]}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-wider bg-muted/40 text-muted-foreground/70 border-border/50"
            >
              Bloqueado
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
            {achievement.title}
            {unlocked && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {achievement.description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 text-[10px] text-muted-foreground/80 font-medium">
        <span className="block truncate">Requisito: {achievement.requirement}</span>
      </div>
    </div>
  )
}

export function AchievementPill({ achievement }: { achievement: ComputedAchievement }) {
  const Icon = achievement.icon
  const { unlocked } = achievement

  return (
    <div
      title={unlocked ? achievement.title : `Bloqueado — ${achievement.requirement}`}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
        unlocked
          ? "bg-primary/10 border-primary/25 text-foreground hover:bg-primary/15"
          : "bg-muted/30 border-border/50 text-muted-foreground/60"
      )}
    >
      {unlocked ? (
        <Icon className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Lock className="w-3 h-3" />
      )}
      {achievement.title}
    </div>
  )
}
