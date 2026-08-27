/**
 * Estilos de estado compartidos.
 *
 * `difficultyColors` estaba definido tres veces —formation-detail.tsx,
 * library-content.tsx y formations-carousel.tsx— con valores que ya
 * habían empezado a divergir (/10 en unos sitios, /20 en otros). Al
 * vivir en tres ficheros, cambiar la paleta obligaba a acordarse de
 * los tres.
 *
 * Todo apunta a las rampas semánticas de globals.css en lugar de a la
 * paleta cruda de Tailwind: un solo sistema de color, no dos.
 */

export const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-success-soft text-success-strong border-success-border",
  intermediate: "bg-warning-soft text-warning-strong border-warning-border",
  advanced: "bg-danger-soft text-danger-strong border-danger-border",
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export function difficultyStyle(difficulty: string | null | undefined) {
  return DIFFICULTY_STYLES[difficulty ?? "beginner"] ?? DIFFICULTY_STYLES.beginner
}

export function difficultyLabel(difficulty: string | null | undefined) {
  return DIFFICULTY_LABELS[difficulty ?? "beginner"] ?? DIFFICULTY_LABELS.beginner
}

/** Estados de suscripción y de reserva. */
export const STATUS_STYLES = {
  success: "bg-success-soft text-success-strong border-success-border",
  warning: "bg-warning-soft text-warning-strong border-warning-border",
  danger: "bg-danger-soft text-danger-strong border-danger-border",
  info: "bg-info-soft text-info-strong border-info-border",
  neutral: "bg-muted text-muted-foreground border-border",
} as const

export type StatusTone = keyof typeof STATUS_STYLES
