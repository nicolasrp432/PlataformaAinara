import { z } from "zod"

const score = z.number().int().min(1).max(10)
export const lifeWheelSchema = z.object({
  scores: z.object({ health: score, relationships: score, family: score, work: score, money: score, growth: score, leisure: score, environment: score }).strict(),
  focus: z.enum(["health", "relationships", "family", "work", "money", "growth", "leisure", "environment"]),
  intention: z.string().trim().min(1, "Escribe un pequeño paso para esta semana.").max(500),
}).strict()
