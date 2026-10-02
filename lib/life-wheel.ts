import type { z } from "zod"
import type { lifeWheelSchema } from "@/lib/validations/life-wheel"

export const LIFE_AREAS = [
  { key: "health", label: "Salud y energía", question: "¿Cómo te sientes en tu cuerpo y cuánto cuidas tu descanso?", color: "#9A751C" },
  { key: "relationships", label: "Amor y vínculos", question: "¿Tus relaciones te permiten sentir conexión y ser tú?", color: "#B8902E" },
  { key: "family", label: "Familia y amistad", question: "¿Encuentras apoyo y tiempo para las personas que te importan?", color: "#9E7736" },
  { key: "work", label: "Trabajo y propósito", question: "¿Lo que haces tiene sentido para ti en este momento?", color: "#7A5F0C" },
  { key: "money", label: "Economía", question: "¿Cómo vives tu relación con el dinero y tu tranquilidad económica?", color: "#AE8741" },
  { key: "growth", label: "Crecimiento personal", question: "¿Tienes espacio para aprender y conocerte mejor?", color: "#806329" },
  { key: "leisure", label: "Disfrute y descanso", question: "¿Hay lugar para el juego, el descanso y aquello que disfrutas?", color: "#B08C32" },
  { key: "environment", label: "Entorno y hogar", question: "¿Tu espacio cotidiano te ayuda a sentir bienestar?", color: "#816E44" },
] as const
export type LifeAreaKey = (typeof LIFE_AREAS)[number]["key"]
export type LifeWheelInput = z.infer<typeof lifeWheelSchema>
export type LifeWheelEntry = LifeWheelInput & { id: string; created_at: string }
export const INITIAL_SCORES: LifeWheelInput["scores"] = { health: 5, relationships: 5, family: 5, work: 5, money: 5, growth: 5, leisure: 5, environment: 5 }
export function wheelAverage(scores: LifeWheelInput["scores"]) {
  return LIFE_AREAS.reduce((sum, area) => sum + scores[area.key], 0) / LIFE_AREAS.length
}
