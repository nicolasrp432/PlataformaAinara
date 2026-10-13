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
  description: string
  question: string
}

/** Los 5 estados válidos del CHECK de `daily_reflections.mood`. */
export const MOODS: Mood[] = [
  { id: "radiante", label: "Radiante", icon: Sun, description: "Alegría, entusiasmo", question: "¿Qué te dio alegría y cómo podrías hacerle espacio otra vez?" },
  { id: "en_calma", label: "En calma", icon: Sparkles, description: "Paz, tranquilidad", question: "¿Qué te ayudó a sentir calma hoy?" },
  { id: "neutral", label: "Neutral", icon: Minus, description: "Estabilidad, equilibrio", question: "¿Qué notas en ti al detenerte un momento?" },
  { id: "nublado", label: "Nublado", icon: Cloud, description: "Tristeza, cansancio", question: "¿Qué te está pesando y qué apoyo necesitas?" },
  { id: "tormenta", label: "Tormenta", icon: CloudRain, description: "Tensión, agobio", question: "¿Qué te sobrepasó y qué pequeño gesto podría cuidarte ahora?" },
]

export const MOOD_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.icon])
)

export const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.label])
)

/** Color del estado en el calendario, coherente con la paleta del sistema. */
export const MOOD_TONES: Record<string, string> = {
  radiante: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  en_calma: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  neutral: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  nublado: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  tormenta: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
}
