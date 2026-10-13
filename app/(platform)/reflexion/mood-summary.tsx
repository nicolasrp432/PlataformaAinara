import { MOODS, MOOD_TONES } from "./moods"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { cn } from "@/lib/utils"

export function MoodSummary({ entries }: { entries: DailyReflectionEntry[] }) {
  if (entries.length === 0) return null
  return (
    <section aria-label="Resumen de tus emociones" className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Tu mapa emocional</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Distribución de tus {entries.length} registros recientes. Cada emoción tiene su lugar.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((mood) => {
          const count = entries.filter((entry) => entry.mood === mood.id).length
          const Icon = mood.icon
          return (
            <span key={mood.id} className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs", MOOD_TONES[mood.id])}>
              <Icon aria-hidden="true" className="h-4 w-4" />
              {mood.label} <strong>{count}</strong>
            </span>
          )
        })}
      </div>
    </section>
  )
}
