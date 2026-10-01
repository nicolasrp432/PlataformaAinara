import { z } from "zod"

export const LIFE_AREAS = [
  { key: "health", label: "Salud y energía", question: "¿Cómo te sientes en tu cuerpo y cuánto cuidas tu descanso?", color: "#187e78" },
  { key: "relationships", label: "Amor y vínculos", question: "¿Tus relaciones te permiten sentir conexión y ser tú?", color: "#b35670" },
  { key: "family", label: "Familia y amistad", question: "¿Encuentras apoyo y tiempo para las personas que te importan?", color: "#b87732" },
  { key: "work", label: "Trabajo y propósito", question: "¿Lo que haces tiene sentido para ti en este momento?", color: "#527797" },
  { key: "money", label: "Economía", question: "¿Cómo vives tu relación con el dinero y tu tranquilidad económica?", color: "#697747" },
  { key: "growth", label: "Crecimiento personal", question: "¿Tienes espacio para aprender y conocerte mejor?", color: "#8268a3" },
  { key: "leisure", label: "Disfrute y descanso", question: "¿Hay lugar para el juego, el descanso y aquello que disfrutas?", color: "#b65e38" },
  { key: "environment", label: "Entorno y hogar", question: "¿Tu espacio cotidiano te ayuda a sentir bienestar?", color: "#467c88" },
] as const
export type LifeAreaKey = (typeof LIFE_AREAS)[number]["key"]
const score = z.number().int().min(1).max(10)
export const lifeWheelSchema = z.object({
  scores: z.object({ health: score, relationships: score, family: score, work: score, money: score, growth: score, leisure: score, environment: score }).strict(),
  focus: z.enum(["health", "relationships", "family", "work", "money", "growth", "leisure", "environment"]),
  intention: z.string().trim().min(1, "Escribe un pequeño paso para esta semana.").max(500),
}).strict()
export type LifeWheelInput = z.infer<typeof lifeWheelSchema>
export type LifeWheelEntry = LifeWheelInput & { id: string; created_at: string }
export const INITIAL_SCORES: LifeWheelInput["scores"] = { health: 5, relationships: 5, family: 5, work: 5, money: 5, growth: 5, leisure: 5, environment: 5 }
export function wheelAverage(scores: LifeWheelInput["scores"]) {
  return LIFE_AREAS.reduce((sum, area) => sum + scores[area.key], 0) / LIFE_AREAS.length
}
