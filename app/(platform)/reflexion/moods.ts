import {
  Cloud,
  CloudRain,
  Minus,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react"

export interface Mood {
  id: string
  label: string
  icon: LucideIcon
}

/** Los 5 estados válidos del CHECK de `daily_reflections.mood`. */
export const MOODS: Mood[] = [
  { id: "radiante", label: "Radiante", icon: Sun },
  { id: "en_calma", label: "En calma", icon: Sparkles },
  { id: "neutral", label: "Neutral", icon: Minus },
  { id: "nublado", label: "Nublado", icon: Cloud },
  { id: "tormenta", label: "Tormenta", icon: CloudRain },
]

export const MOOD_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.icon])
)

export const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.label])
)

/** Color del estado en el calendario, coherente con la paleta del sistema. */
export const MOOD_TONES: Record<string, string> = {
  radiante: "bg-primary/25 text-primary",
  en_calma: "bg-emerald-500/20 text-emerald-600",
  neutral: "bg-muted text-muted-foreground",
  nublado: "bg-sky-500/20 text-sky-600",
  tormenta: "bg-rose-500/20 text-rose-600",
}
